import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  FileArrowUp, 
  Play, 
  Spinner, 
  Check, 
  X, 
  Eye, 
  EyeSlash,
  Trash,
  UserPlus,
  UserMinus,
  Warning,
  DownloadSimple
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface BulkCsvPageProps {
  token: string
  setToken: (value: string) => void
  enterprise: string
  setEnterprise: (value: string) => void
}

interface CsvUser {
  name: string
  email: string
  username?: string
  status: 'pending' | 'resolving' | 'resolved' | 'not_found' | 'error' | 'processing' | 'success' | 'failed'
  error?: string
}

interface CostCenter {
  id: string
  name: string
}

export default function BulkCsvPage({ token, setToken, enterprise, setEnterprise }: BulkCsvPageProps) {
  const [showToken, setShowToken] = useState(false)
  const [csvData, setCsvData] = useState<CsvUser[]>([])
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [selectedCostCenter, setSelectedCostCenter] = useState('')
  const [operation, setOperation] = useState<'add' | 'remove'>('add')
  const [loading, setLoading] = useState(false)
  const [loadingCostCenters, setLoadingCostCenters] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<'upload' | 'resolve' | 'execute' | 'done'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCSV = (text: string): CsvUser[] => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
    const nameIndex = headers.findIndex(h => h === 'name' || h === '이름')
    const emailIndex = headers.findIndex(h => h === 'email' || h === '이메일')

    if (emailIndex === -1) {
      toast.error('CSV에 email 컬럼이 필요합니다')
      return []
    }

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      return {
        name: nameIndex !== -1 ? values[nameIndex] : '',
        email: values[emailIndex],
        status: 'pending' as const
      }
    }).filter(user => user.email)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const users = parseCSV(text)
      if (users.length > 0) {
        setCsvData(users)
        setCurrentStep('upload')
        toast.success(`${users.length}명의 사용자를 불러왔습니다`)
      }
    }
    reader.readAsText(file)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const fetchCostCenters = async () => {
    if (!token || !enterprise) {
      toast.error('Token과 Enterprise slug를 입력해주세요')
      return
    }

    setLoadingCostCenters(true)
    try {
      const res = await fetch(
        `https://api.github.com/enterprises/${enterprise}/settings/billing/cost-centers`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      )

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`)
      }

      const data = await res.json()
      const allCenters = data.costCenters || data.cost_centers || []
      setCostCenters(allCenters.filter((cc: CostCenter & { state?: string }) => cc.state !== 'deleted'))
      toast.success('Cost Center 목록을 불러왔습니다')
    } catch (error) {
      toast.error('Cost Center 목록을 불러오는데 실패했습니다')
    } finally {
      setLoadingCostCenters(false)
    }
  }

  const resolveUsernames = async () => {
    if (!token) {
      toast.error('GitHub Token을 입력해주세요')
      return
    }

    if (!enterprise) {
      toast.error('Enterprise slug를 입력해주세요')
      return
    }

    setCurrentStep('resolve')
    setLoading(true)
    setProgress(0)

    const updatedUsers = [...csvData]
    let resolved = 0

    // 1단계: Enterprise SCIM API로 이메일 → GitHub username 매핑
    const scimUsers = new Map<string, string>() // email -> GitHub login
    try {
      let startIndex = 1
      const count = 100
      let totalResults = Infinity

      while (startIndex <= totalResults) {
        const scimRes = await fetch(
          `https://api.github.com/scim/v2/enterprises/${enterprise}/Users?startIndex=${startIndex}&count=${count}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/scim+json',
              'X-GitHub-Api-Version': '2022-11-28'
            }
          }
        )

        if (scimRes.ok) {
          const scimData = await scimRes.json()
          totalResults = scimData.totalResults || 0
          const resources = scimData.Resources || []
          for (const resource of resources) {
            const emails = resource.emails || []
            const userName = resource.userName || ''
            // userName에 @가 포함되면 이메일이므로 GitHub login이 아님 → 건너뜀
            const githubLogin = userName.includes('@') ? '' : userName
            if (!githubLogin) continue
            for (const emailObj of emails) {
              const email = (typeof emailObj === 'string' ? emailObj : emailObj.value || '').toLowerCase()
              if (email) {
                scimUsers.set(email, githubLogin)
              }
            }
          }
          startIndex += count
        } else {
          break
        }
      }
    } catch {
      // SCIM API 실패 시 fallback으로 진행
    }

    // 2단계: 각 CSV 유저의 이메일로 username 매칭
    for (let i = 0; i < updatedUsers.length; i++) {
      const user = updatedUsers[i]
      user.status = 'resolving'
      setCsvData([...updatedUsers])

      // SCIM 결과에서 이메일로 GitHub login 찾기
      const scimMatch = scimUsers.get(user.email.toLowerCase())
      if (scimMatch) {
        user.username = scimMatch
        user.status = 'resolved'
        resolved++
        setProgress(((i + 1) / updatedUsers.length) * 100)
        setCsvData([...updatedUsers])
        continue
      }

      // SCIM에서 못 찾으면 CSV의 name 컬럼을 GitHub username으로 사용 (EMU 환경)
      if (user.name) {
        user.username = user.name
        user.status = 'resolved'
        resolved++
        setProgress(((i + 1) / updatedUsers.length) * 100)
        setCsvData([...updatedUsers])
        continue
      }

      user.status = 'not_found'
      user.error = '이메일에 해당하는 사용자를 찾을 수 없습니다'

      setProgress(((i + 1) / updatedUsers.length) * 100)
      setCsvData([...updatedUsers])
    }

    setLoading(false)
    toast.success(`${resolved}명의 사용자 정보를 확인했습니다`)
  }

  const executeBulkOperation = async () => {
    if (!selectedCostCenter) {
      toast.error('Cost Center를 선택해주세요')
      return
    }

    const usersToProcess = csvData.filter(u => u.status === 'resolved' && u.username)
    if (usersToProcess.length === 0) {
      toast.error('처리할 사용자가 없습니다')
      return
    }

    setCurrentStep('execute')
    setLoading(true)
    setProgress(0)

    const updatedUsers = [...csvData]
    const usernames = usersToProcess.map(u => u.username!)
    
    const batchSize = 100
    let processed = 0
    let success = 0

    for (let i = 0; i < usernames.length; i += batchSize) {
      const batch = usernames.slice(i, i + batchSize)
      
      updatedUsers.forEach(u => {
        if (batch.includes(u.username!)) {
          u.status = 'processing'
        }
      })
      setCsvData([...updatedUsers])

      try {
        const method = operation === 'add' ? 'POST' : 'DELETE'
        const url = `https://api.github.com/enterprises/${enterprise}/settings/billing/cost-centers/${selectedCostCenter}/resource`
        
        const res = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ users: batch })
        })

        if (res.ok) {
          updatedUsers.forEach(u => {
            if (batch.includes(u.username!)) {
              u.status = 'success'
              success++
            }
          })
        } else {
          const errorData = await res.json().catch(() => ({}))
          updatedUsers.forEach(u => {
            if (batch.includes(u.username!)) {
              u.status = 'failed'
              u.error = `${res.status}: ${errorData.message || res.statusText}`
            }
          })
        }
      } catch (error) {
        updatedUsers.forEach(u => {
          if (batch.includes(u.username!)) {
            u.status = 'failed'
            u.error = 'Network error'
          }
        })
      }

      processed += batch.length
      setProgress((processed / usernames.length) * 100)
      setCsvData([...updatedUsers])
    }

    setLoading(false)
    setCurrentStep('done')
    toast.success(`${success}명의 사용자를 ${operation === 'add' ? '추가' : '삭제'}했습니다`)
  }

  const clearData = () => {
    setCsvData([])
    setProgress(0)
    setCurrentStep('upload')
  }

  const downloadResults = () => {
    const headers = ['Name', 'Email', 'Username', 'Status', 'Error']
    const rows = csvData.map(u => [
      u.name,
      u.email,
      u.username || '',
      u.status,
      u.error || ''
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cost-center-results.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: CsvUser['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-muted-foreground">대기</Badge>
      case 'resolving':
        return <Badge variant="outline" className="text-primary"><Spinner className="w-3 h-3 mr-1 animate-spin" />조회중</Badge>
      case 'resolved':
        return <Badge className="bg-accent text-accent-foreground"><Check className="w-3 h-3 mr-1" />확인됨</Badge>
      case 'not_found':
        return <Badge variant="destructive"><Warning className="w-3 h-3 mr-1" />미발견</Badge>
      case 'error':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />오류</Badge>
      case 'processing':
        return <Badge variant="outline" className="text-primary"><Spinner className="w-3 h-3 mr-1 animate-spin" />처리중</Badge>
      case 'success':
        return <Badge className="bg-accent text-accent-foreground"><Check className="w-3 h-3 mr-1" />완료</Badge>
      case 'failed':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />실패</Badge>
    }
  }

  const resolvedCount = csvData.filter(u => u.status === 'resolved' || u.status === 'success').length
  const failedCount = csvData.filter(u => u.status === 'not_found' || u.status === 'error' || u.status === 'failed').length

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">대량 CSV 작업</h2>
        <p className="text-muted-foreground">
          CSV 파일을 업로드하여 대량의 사용자를 Cost Center에 추가하거나 삭제할 수 있습니다.
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">설정</CardTitle>
          <CardDescription>인증 정보와 설정을 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bulk-token">GitHub 토큰</Label>
              <div className="relative">
                <Input
                  id="bulk-token"
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="pr-10 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-enterprise">엔터프라이즈 Slug</Label>
              <Input
                id="bulk-enterprise"
                value={enterprise}
                onChange={(e) => setEnterprise(e.target.value)}
                placeholder="my-enterprise"
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>비용 센터</Label>
              <div className="flex gap-2">
                <Select value={selectedCostCenter} onValueChange={setSelectedCostCenter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Cost Center 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {costCenters.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>
                        {cc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={fetchCostCenters}
                  disabled={loadingCostCenters}
                >
                  {loadingCostCenters ? <Spinner className="w-4 h-4 animate-spin" /> : '불러오기'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>작업</Label>
              <Select value={operation} onValueChange={(v) => setOperation(v as 'add' | 'remove')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-accent" />
                      사용자 추가
                    </div>
                  </SelectItem>
                  <SelectItem value="remove">
                    <div className="flex items-center gap-2">
                      <UserMinus className="w-4 h-4 text-destructive" />
                      사용자 삭제
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">CSV 데이터</CardTitle>
              <CardDescription>
                name, email 컬럼이 포함된 CSV 파일을 업로드하세요
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {csvData.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={downloadResults}>
                    <DownloadSimple className="w-4 h-4 mr-1" />
                    결과 다운로드
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearData}>
                    <Trash className="w-4 h-4 mr-1" />
                    초기화
                  </Button>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <FileArrowUp className="w-4 h-4 mr-2" />
                CSV 업로드
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {currentStep === 'resolve' ? '사용자 정보 조회 중...' : '작업 실행 중...'}
                </span>
                <span className="text-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {csvData.length > 0 ? (
            <>
              <div className="flex items-center gap-4 mb-4 text-sm">
                <span className="text-muted-foreground">
                  총 <strong className="text-foreground">{csvData.length}</strong>명
                </span>
                <span className="text-accent">
                  확인됨 <strong>{resolvedCount}</strong>
                </span>
                <span className="text-destructive">
                  실패 <strong>{failedCount}</strong>
                </span>
              </div>

              <ScrollArea className="h-[400px] rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead className="w-24">상태</TableHead>
                      <TableHead>오류</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell className="font-mono text-sm">{user.email}</TableCell>
                        <TableCell className="font-mono text-sm text-accent">
                          {user.username || '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="text-xs text-destructive">{user.error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="flex justify-end gap-2 mt-4">
                {currentStep === 'upload' && (
                  <Button onClick={resolveUsernames} disabled={loading}>
                    {loading ? <Spinner className="w-4 h-4 mr-2 animate-spin" /> : <Play weight="fill" className="w-4 h-4 mr-2" />}
                    1단계: Username 조회
                  </Button>
                )}
                {(currentStep === 'resolve' || currentStep === 'execute' || currentStep === 'done') && resolvedCount > 0 && (
                  <Button 
                    onClick={executeBulkOperation} 
                    disabled={loading || !selectedCostCenter}
                    variant={operation === 'remove' ? 'destructive' : 'default'}
                  >
                    {loading ? <Spinner className="w-4 h-4 mr-2 animate-spin" /> : 
                      operation === 'add' ? <UserPlus className="w-4 h-4 mr-2" /> : <UserMinus className="w-4 h-4 mr-2" />}
                    2단계: {operation === 'add' ? '사용자 추가' : '사용자 삭제'} ({resolvedCount}명)
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileArrowUp className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-sm mb-2">CSV 파일을 업로드하세요</p>
              <p className="text-xs">name, email 컬럼이 포함되어야 합니다</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Spinner, Check, X, Eye, EyeSlash, Copy } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { API_ENDPOINTS, getMethodColor, ApiEndpoint } from '@/lib/api-data'

interface TryoutPageProps {
  token: string
  setToken: (value: string) => void
  enterprise: string
  setEnterprise: (value: string) => void
}

interface ApiResponse {
  status: number
  statusText: string
  data: unknown
  headers: Record<string, string>
}

export default function TryoutPage({ token, setToken, enterprise, setEnterprise }: TryoutPageProps) {
  const [selectedApi, setSelectedApi] = useState<string>('')
  const [costCenterId, setCostCenterId] = useState('')
  const [users, setUsers] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [showToken, setShowToken] = useState(false)

  const selectedEndpoint = API_ENDPOINTS.find(e => e.id === selectedApi)

  const buildUrl = (endpoint: ApiEndpoint): string => {
    let url = `https://api.github.com${endpoint.path}`
    url = url.replace('{enterprise}', enterprise || '{enterprise}')
    url = url.replace('{cost_center_id}', costCenterId || '{cost_center_id}')
    return url
  }

  const executeRequest = async () => {
    if (!selectedEndpoint) {
      toast.error('API를 선택해주세요')
      return
    }

    if (!token) {
      toast.error('GitHub Token을 입력해주세요')
      return
    }

    if (!enterprise) {
      toast.error('Enterprise slug를 입력해주세요')
      return
    }

    if (selectedEndpoint.id !== 'get-cost-centers' && !costCenterId) {
      toast.error('Cost Center ID를 입력해주세요')
      return
    }

    setLoading(true)
    setResponse(null)

    try {
      const url = buildUrl(selectedEndpoint)
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers
      }

      if (selectedEndpoint.method !== 'GET' && users) {
        const userList = users.split(',').map(u => u.trim()).filter(Boolean)
        options.body = JSON.stringify({ users: userList })
        headers['Content-Type'] = 'application/json'
      }

      const res = await fetch(url, options)
      
      const responseHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      let data: unknown
      const contentType = res.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        data = await res.json()
      } else {
        data = await res.text()
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
        headers: responseHeaders
      })

      if (res.ok) {
        toast.success('API 요청 성공')
      } else {
        toast.error(`API 요청 실패: ${res.status}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setResponse({
        status: 0,
        statusText: 'Network Error',
        data: { error: errorMessage },
        headers: {}
      })
      toast.error('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2))
      toast.success('응답이 클립보드에 복사되었습니다')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">API 테스트</h2>
        <p className="text-muted-foreground">
          Cost Center API를 직접 테스트해보세요. Postman처럼 요청을 보내고 응답을 확인할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">요청 설정</CardTitle>
            <CardDescription>인증 정보와 파라미터를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">GitHub 토큰</Label>
              <div className="relative">
                <Input
                  id="token"
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
              <p className="text-xs text-muted-foreground">
                manage_billing:enterprise 권한이 필요합니다
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enterprise">엔터프라이즈 Slug</Label>
              <Input
                id="enterprise"
                value={enterprise}
                onChange={(e) => setEnterprise(e.target.value)}
                placeholder="my-enterprise"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>API 엔드포인트</Label>
              <Select value={selectedApi} onValueChange={setSelectedApi}>
                <SelectTrigger>
                  <SelectValue placeholder="API를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {API_ENDPOINTS.map((endpoint) => (
                    <SelectItem key={endpoint.id} value={endpoint.id}>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getMethodColor(endpoint.method)} font-mono text-xs px-1.5 py-0`}>
                          {endpoint.method}
                        </Badge>
                        <span>{endpoint.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEndpoint && selectedEndpoint.id !== 'get-cost-centers' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="costCenterId">Cost Center ID</Label>
                  <Input
                    id="costCenterId"
                    value={costCenterId}
                    onChange={(e) => setCostCenterId(e.target.value)}
                    placeholder="cc_1234567890"
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="users">사용자 (쉼표로 구분)</Label>
                  <Input
                    id="users"
                    value={users}
                    onChange={(e) => setUsers(e.target.value)}
                    placeholder="octocat, hubot, monalisa"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    GitHub 유저네임을 쉼표로 구분하여 입력하세요
                  </p>
                </div>
              </>
            )}

            {selectedEndpoint && (
              <div className="pt-2 space-y-2">
                <Label>요청 URL</Label>
                <div className="bg-secondary rounded-lg p-3 font-mono text-sm break-all">
                  <span className={`${getMethodColor(selectedEndpoint.method)} px-1.5 py-0.5 rounded text-xs mr-2`}>
                    {selectedEndpoint.method}
                  </span>
                  {buildUrl(selectedEndpoint)}
                </div>
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={executeRequest}
              disabled={loading || !selectedApi}
            >
              {loading ? (
                <>
                  <Spinner className="w-4 h-4 mr-2 animate-spin" />
                  요청 중...
                </>
              ) : (
                <>
                  <Play weight="fill" className="w-4 h-4 mr-2" />
                  요청 실행
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">응답</CardTitle>
              <CardDescription>API 응답 결과</CardDescription>
            </div>
            {response && (
              <Button variant="ghost" size="icon" onClick={copyResponse}>
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {response ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={response.status >= 200 && response.status < 300 ? 'default' : 'destructive'}
                    className="flex items-center gap-1"
                  >
                    {response.status >= 200 && response.status < 300 ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                    {response.status} {response.statusText}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">응답 본문</Label>
                  <div className="bg-secondary rounded-lg p-4 max-h-80 overflow-auto scrollbar-thin">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  </div>
                </div>

                {Object.keys(response.headers).length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">응답 헤더</Label>
                    <div className="bg-secondary rounded-lg p-4 max-h-40 overflow-auto scrollbar-thin">
                      <pre className="text-xs font-mono">
                        {Object.entries(response.headers)
                          .filter(([key]) => key.toLowerCase().includes('ratelimit') || key.toLowerCase().includes('x-github'))
                          .map(([key, value]) => `${key}: ${value}`)
                          .join('\n')}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Play className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm">API 요청을 실행하면 여기에 결과가 표시됩니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

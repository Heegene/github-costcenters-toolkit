import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Copy, Info } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { API_ENDPOINTS, getMethodColor } from '@/lib/api-data'

function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    toast.success('클립보드에 복사되었습니다')
  }

  return (
    <div className="relative group">
      <pre className="bg-secondary rounded-lg p-4 overflow-x-auto text-sm font-mono scrollbar-thin">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={copyToClipboard}
      >
        <Copy className="w-4 h-4" />
      </Button>
    </div>
  )
}

export default function DocumentationPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">API 문서</h2>
        <p className="text-muted-foreground">
          GitHub Enterprise Cloud Cost Center API를 사용하여 엔터프라이즈의 비용 센터를 관리하고 사용자를 할당할 수 있습니다.
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            인증 (Authentication)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            모든 API 요청에는 <code className="bg-secondary px-1.5 py-0.5 rounded text-accent">manage_billing:enterprise</code> 권한이 있는 Personal Access Token (Classic) 또는 Fine-grained Token이 필요합니다.
          </p>
          <CodeBlock 
            code={`Authorization: Bearer YOUR_TOKEN
X-GitHub-Api-Version: 2022-11-28
Accept: application/vnd.github+json`}
            language="http"
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-medium text-foreground">엔드포인트</h3>
        
        <Accordion type="single" collapsible className="space-y-3">
          {API_ENDPOINTS.map((endpoint) => (
            <AccordionItem 
              key={endpoint.id} 
              value={endpoint.id}
              className="border border-border rounded-lg bg-card overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/50">
                <div className="flex items-center gap-3 text-left">
                  <Badge className={`${getMethodColor(endpoint.method)} font-mono text-xs px-2 py-0.5`}>
                    {endpoint.method}
                  </Badge>
                  <span className="font-medium">{endpoint.name}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">엔드포인트</h4>
                    <CodeBlock code={`${endpoint.method} https://api.github.com${endpoint.path}`} />
                  </div>

                  {endpoint.pathParams.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">경로 파라미터</h4>
                      <div className="space-y-2">
                        {endpoint.pathParams.map((param) => (
                          <div key={param.name} className="flex items-start gap-2 text-sm">
                            <code className="bg-secondary px-1.5 py-0.5 rounded text-accent font-mono">
                              {param.name}
                            </code>
                            {param.required && (
                              <Badge variant="outline" className="text-xs border-destructive text-destructive">
                                required
                              </Badge>
                            )}
                            <span className="text-muted-foreground">{param.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {endpoint.bodyParams.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">요청 본문 (Request Body)</h4>
                      <div className="space-y-2">
                        {endpoint.bodyParams.map((param) => (
                          <div key={param.name} className="flex items-start gap-2 text-sm">
                            <code className="bg-secondary px-1.5 py-0.5 rounded text-accent font-mono">
                              {param.name}
                            </code>
                            <span className="text-muted-foreground/70">({param.type})</span>
                            {param.required && (
                              <Badge variant="outline" className="text-xs border-destructive text-destructive">
                                required
                              </Badge>
                            )}
                            <span className="text-muted-foreground">{param.description}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <h5 className="text-xs font-medium text-muted-foreground mb-2">요청 본문 예시</h5>
                        <CodeBlock 
                          code={JSON.stringify({ users: ["octocat", "hubot"] }, null, 2)} 
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium mb-2">응답 예시</h4>
                    <CodeBlock code={JSON.stringify(endpoint.responseExample, null, 2)} />
                  </div>

                  {endpoint.notes && endpoint.notes.length > 0 && (
                    <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        참고 사항
                      </h4>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        {endpoint.notes.map((note, i) => (
                          <li key={i}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">요청 제한 (Rate Limits)</CardTitle>
          <CardDescription>
            API 호출 제한에 대한 정보
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            GitHub Enterprise Cloud API는 시간당 <strong className="text-foreground">15,000</strong> 요청으로 제한됩니다.
          </p>
          <p>
            Rate limit 정보는 응답 헤더에서 확인할 수 있습니다:
          </p>
          <CodeBlock 
            code={`X-RateLimit-Limit: 15000
X-RateLimit-Remaining: 14999
X-RateLimit-Reset: 1698753600`}
            language="http"
          />
        </CardContent>
      </Card>
    </div>
  )
}

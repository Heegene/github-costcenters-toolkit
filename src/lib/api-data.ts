export interface ApiEndpoint {
  id: string
  name: string
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT'
  path: string
  description: string
  pathParams: { name: string; description: string; required: boolean }[]
  bodyParams: { name: string; type: string; description: string; required: boolean }[]
  responseExample: object
  notes?: string[]
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'add-cost-center',
    name: '비용 센터에 리소스 추가',
    method: 'POST',
    path: '/enterprises/{enterprise}/settings/billing/cost-centers/{cost_center_id}/resource',
    description: '지정된 비용 센터에 리소스(사용자)를 추가합니다. 이를 통해 엔터프라이즈 내 특정 사용자의 비용을 분류하고 추적할 수 있습니다.',
    pathParams: [
      { name: 'enterprise', description: '엔터프라이즈의 slug', required: true },
      { name: 'cost_center_id', description: '비용 센터의 고유 식별자', required: true }
    ],
    bodyParams: [
      { name: 'users', type: 'array of strings', description: '비용 센터에 추가할 GitHub 사용자명 배열', required: true }
    ],
    responseExample: {
      message: "Resources successfully added to cost center"
    },
    notes: [
      'billing:write 권한이 있는 엔터프라이즈 관리자 액세스가 필요합니다',
      '사용자는 엔터프라이즈의 멤버여야 합니다',
      '한 사용자는 하나의 비용 센터에만 소속할 수 있습니다'
    ]
  },
  {
    id: 'remove-cost-center',
    name: '비용 센터에서 리소스 제거',
    method: 'DELETE',
    path: '/enterprises/{enterprise}/settings/billing/cost-centers/{cost_center_id}/resource',
    description: '지정된 비용 센터에서 리소스(사용자)를 제거합니다. 해당 사용자는 더 이상 이 비용 센터의 과금 추적 대상에 포함되지 않습니다.',
    pathParams: [
      { name: 'enterprise', description: '엔터프라이즈의 slug', required: true },
      { name: 'cost_center_id', description: '비용 센터의 고유 식별자', required: true }
    ],
    bodyParams: [
      { name: 'users', type: 'array of strings', description: '비용 센터에서 제거할 GitHub 사용자명 배열', required: true }
    ],
    responseExample: {
      message: "Resources successfully removed from cost center"
    },
    notes: [
      'billing:write 권한이 있는 엔터프라이즈 관리자 액세스가 필요합니다',
      '사용자가 현재 해당 비용 센터에 할당되어 있어야 합니다'
    ]
  },
  {
    id: 'get-cost-centers',
    name: '모든 비용 센터 조회',
    method: 'GET',
    path: '/enterprises/{enterprise}/settings/billing/cost-centers',
    description: '엔터프라이즈에 구성된 모든 비용 센터 목록을 조회합니다. 다른 API 작업에 필요한 비용 센터 ID를 확인할 때 사용합니다.',
    pathParams: [
      { name: 'enterprise', description: '엔터프라이즈의 slug', required: true }
    ],
    bodyParams: [],
    responseExample: {
      cost_centers: [
        {
          id: "cc_1234567890",
          name: "Engineering Team",
          resources: {
            users: ["octocat", "hubot"]
          }
        }
      ]
    },
    notes: [
      'billing:read 권한이 있는 엔터프라이즈 관리자 액세스가 필요합니다'
    ]
  }
]

export const getMethodColor = (method: string): string => {
  switch (method) {
    case 'GET':
      return 'bg-method-get text-accent-foreground'
    case 'POST':
      return 'bg-method-post text-primary-foreground'
    case 'DELETE':
      return 'bg-method-delete text-destructive-foreground'
    case 'PATCH':
      return 'bg-method-patch text-accent-foreground'
    case 'PUT':
      return 'bg-method-patch text-accent-foreground'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

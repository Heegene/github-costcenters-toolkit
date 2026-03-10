import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Book, Lightning, FileArrowUp } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import DocumentationPage from '@/components/pages/DocumentationPage'
import TryoutPage from '@/components/pages/TryoutPage'
import BulkCsvPage from '@/components/pages/BulkCsvPage'

function App() {
  const [activeTab, setActiveTab] = useState('documentation')
  const [token, setToken] = useState('')
  const [enterprise, setEnterprise] = useState('')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary-foreground" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Cost Center API Toolkit</h1>
            <p className="text-sm text-muted-foreground">GitHub Enterprise Cloud Billing API</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-secondary">
            <TabsTrigger value="documentation" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Book weight="bold" className="w-4 h-4" />
              <span className="hidden sm:inline">문서</span>
              <span className="sm:hidden">문서</span>
            </TabsTrigger>
            <TabsTrigger value="tryout" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Lightning weight="bold" className="w-4 h-4" />
              <span className="hidden sm:inline">API 테스트</span>
              <span className="sm:hidden">테스트</span>
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileArrowUp weight="bold" className="w-4 h-4" />
              <span className="hidden sm:inline">대량 CSV</span>
              <span className="sm:hidden">CSV</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documentation">
            <DocumentationPage />
          </TabsContent>

          <TabsContent value="tryout">
            <TryoutPage 
              token={token} 
              setToken={setToken} 
              enterprise={enterprise}
              setEnterprise={setEnterprise}
            />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkCsvPage 
              token={token} 
              setToken={setToken}
              enterprise={enterprise}
              setEnterprise={setEnterprise}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Toaster richColors position="top-right" />
    </div>
  )
}

export default App

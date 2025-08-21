export default function Header() {
  return (
    <header className="bg-github-dark text-white shadow-lg border-b border-border-light h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-robot text-2xl text-github-blue"></i>
              <h1 className="text-xl font-bold">DocuMind AI</h1>
            </div>
            <span className="text-sm text-gray-300">Code Documentation Generator</span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="bg-github-blue hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              data-testid="button-connect-github"
            >
              <i className="fab fa-github mr-2"></i>Connect GitHub
            </button>
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <i className="fas fa-user text-sm"></i>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

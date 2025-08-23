const { useState, useEffect } = React;

function App() {
  // Existing state
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pastedCode, setPastedCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [commentLevel, setCommentLevel] = useState("standard");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  
  // GitHub integration state
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoContents, setRepoContents] = useState([]);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [pathHistory, setPathHistory] = useState([]);

  // Check for authentication on component mount
  useEffect(() => {
    // Check URL for token (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setAuthToken(token);
      // Store token in cookie for subsequent requests
      document.cookie = `authorization=${token}; path=/; max-age=604800`; // 7 days
      
      // Clear URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Get user info
      fetchUserInfo(token);
    } else {
      // Check if token exists in cookie
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('authorization='));
      if (authCookie) {
        const existingToken = authCookie.split('=')[1];
        setAuthToken(existingToken);
        fetchUserInfo(existingToken);
      }
    }
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch('/auth/user', {
        headers: {
          'Cookie': `authorization=${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        fetchRepositories(token);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchRepositories = async (token) => {
    try {
      const response = await fetch('/repos', {
        headers: {
          'Cookie': `authorization=${token || authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories);
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
    }
  };

  const fetchRepoContents = async (owner, repo, path = "") => {
    try {
      setIsLoading(true);
      const response = await fetch(`/repos/${owner}/${repo}/contents?path=${encodeURIComponent(path)}`, {
        headers: {
          'Cookie': `authorization=${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRepoContents(data.contents);
        setCurrentPath(path);
      }
    } catch (error) {
      console.error('Error fetching repo contents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = '/auth/github';
  };

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST' });
      setUser(null);
      setAuthToken(null);
      setRepositories([]);
      setSelectedRepo(null);
      setRepoContents([]);
      setSelectedFile(null);
      document.cookie = 'authorization=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleRepoSelect = (repo) => {
    setSelectedRepo(repo);
    setRepoContents([]);
    setCurrentPath("");
    setPathHistory([]);
    setSelectedFile(null);
    fetchRepoContents(repo.full_name.split('/')[0], repo.full_name.split('/')[1]);
  };

  const handleFileClick = (item) => {
    if (item.type === "dir") {
      setPathHistory([...pathHistory, currentPath]);
      fetchRepoContents(selectedRepo.full_name.split('/')[0], selectedRepo.full_name.split('/')[1], item.path);
    } else {
      setSelectedFile(item);
      // Auto-detect language from file extension
      const extension = item.name.split('.').pop().toLowerCase();
      const languageMap = {
        'py': 'python',
        'js': 'javascript',
        'jsx': 'javascript', 
        'ts': 'typescript',
        'tsx': 'typescript',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'go': 'go',
        'rs': 'rust'
      };
      if (languageMap[extension]) {
        setLanguage(languageMap[extension]);
      }
    }
  };

  const handleBackClick = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, -1));
      fetchRepoContents(selectedRepo.full_name.split('/')[0], selectedRepo.full_name.split('/')[1], previousPath);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPastedCode(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const codeToAnnotate = activeTab === "upload" ? pastedCode : pastedCode;

    try {
      const response = await fetch("/annotate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: codeToAnnotate,
          language: language,
          comment_level: commentLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      setResult(data.annotated_code);
      setIsLoading(false);
    } catch (error) {
      console.error("Error annotating code:", error);
      setResult(
        `Error: ${error.message}\n\nPlease make sure:\n1. The backend server is running on port 8000\n2. Your OpenAI API key is configured\n3. You have an active internet connection`
      );
      setIsLoading(false);
    }
  };

  const handleGitHubSubmit = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    try {
      const [owner, repo] = selectedRepo.full_name.split('/');
      const response = await fetch("/repos/annotate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `authorization=${authToken}`
        },
        body: JSON.stringify({
          owner: owner,
          repo: repo,
          path: selectedFile.path,
          language: language,
          comment_level: commentLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      setResult(data.annotated_code);
      setIsLoading(false);
    } catch (error) {
      console.error("Error annotating GitHub file:", error);
      setResult(
        `Error: ${error.message}\n\nPlease make sure:\n1. You're logged in to GitHub\n2. The repository is accessible\n3. Your OpenAI API key is configured`
      );
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-16">
          <div>
            <h1
              className={`text-5xl font-semibold mb-6 ${
                darkMode ? "text-white" : "text-black"
              }`}
            >
              Code Commenter
            </h1>
            <p
              className={`text-xl leading-relaxed ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Automatically add meaningful comments and docstrings to your code
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* GitHub Auth */}
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <img 
                    src={user.avatar_url} 
                    alt={user.login}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {user.login}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  darkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                <span>Login with GitHub</span>
              </button>
            )}
            
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-full transition-colors ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          {/* Input Section */}
          <div
            className={`rounded-2xl border p-8 ${
              darkMode
                ? "bg-gray-900 border-gray-800"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <h2
              className={`text-2xl font-medium mb-8 ${
                darkMode ? "text-white" : "text-black"
              }`}
            >
              Input Code
            </h2>

            {/* Tab Navigation */}
            <div
              className={`flex mb-8 border-b ${
                darkMode ? "border-gray-700" : "border-gray-300"
              }`}
            >
              <button
                className={`py-3 px-6 font-medium transition-colors ${
                  activeTab === "upload"
                    ? darkMode
                      ? "text-white border-b-2 border-white"
                      : "text-black border-b-2 border-black"
                    : darkMode
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("upload")}
              >
                Upload File
              </button>
              <button
                className={`py-3 px-6 font-medium transition-colors ${
                  activeTab === "paste"
                    ? darkMode
                      ? "text-white border-b-2 border-white"
                      : "text-black border-b-2 border-black"
                    : darkMode
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("paste")}
              >
                Paste Code
              </button>
              {user && (
                <button
                  className={`py-3 px-6 font-medium transition-colors ${
                    activeTab === "github"
                      ? darkMode
                        ? "text-white border-b-2 border-white"
                        : "text-black border-b-2 border-black"
                      : darkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  onClick={() => setActiveTab("github")}
                >
                  GitHub
                </button>
              )}
            </div>

            {/* File Upload Tab */}
            {activeTab === "upload" && (
              <div className="mb-8">
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all hover:border-opacity-60 ${
                    darkMode
                      ? "border-gray-600 hover:border-gray-500"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="file"
                    accept=".py,.js,.java,.cpp,.c,.html,.css,.php,.rb,.go,.rs,.ts,.tsx,.jsx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg
                      className={`w-16 h-16 mb-6 ${
                        darkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span
                      className={`text-lg font-medium mb-2 ${
                        darkMode ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      {uploadedFile
                        ? uploadedFile.name
                        : "Choose file to upload"}
                    </span>
                    <span
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      .py, .js, .java, .cpp, .c, .html, .css, .php, .rb, .go,
                      .rs, .ts, .tsx, .jsx
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Paste Code Tab */}
            {activeTab === "paste" && (
              <div className="mb-8">
                <textarea
                  value={pastedCode}
                  onChange={(e) => setPastedCode(e.target.value)}
                  placeholder="Paste your code here..."
                  className={`w-full h-80 p-6 border rounded-xl font-mono text-sm transition-all focus:outline-none focus:ring-2 resize-none ${
                    darkMode
                      ? "bg-black border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-gray-600 focus:border-gray-600"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-gray-400 focus:border-gray-400"
                  }`}
                />
              </div>
            )}

            {/* GitHub Tab */}
            {activeTab === "github" && user && (
              <div className="mb-8 space-y-6">
                {/* Repository Selection */}
                {!selectedRepo && (
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Select Repository
                    </label>
                    <div className={`border rounded-xl max-h-64 overflow-y-auto ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
                      {repositories.map((repo) => (
                        <button
                          key={repo.full_name}
                          onClick={() => handleRepoSelect(repo)}
                          className={`w-full p-4 text-left hover:bg-opacity-50 transition-colors border-b last:border-b-0 ${
                            darkMode 
                              ? "hover:bg-gray-800 border-gray-700 text-gray-100" 
                              : "hover:bg-gray-100 border-gray-200 text-gray-900"
                          }`}
                        >
                          <div className="font-medium">{repo.name}</div>
                          {repo.description && (
                            <div className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                              {repo.description}
                            </div>
                          )}
                          <div className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                            {repo.language} • Updated {new Date(repo.updated_at).toLocaleDateString()}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Browser */}
                {selectedRepo && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {selectedRepo.full_name} {currentPath && `/ ${currentPath}`}
                      </label>
                      <button
                        onClick={() => {
                          setSelectedRepo(null);
                          setRepoContents([]);
                          setSelectedFile(null);
                          setCurrentPath("");
                          setPathHistory([]);
                        }}
                        className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                          darkMode 
                            ? "bg-gray-800 text-gray-300 hover:bg-gray-700" 
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        Change Repo
                      </button>
                    </div>
                    
                    <div className={`border rounded-xl max-h-64 overflow-y-auto ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
                      {pathHistory.length > 0 && (
                        <button
                          onClick={handleBackClick}
                          className={`w-full p-3 text-left hover:bg-opacity-50 transition-colors border-b flex items-center space-x-2 ${
                            darkMode 
                              ? "hover:bg-gray-800 border-gray-700 text-gray-300" 
                              : "hover:bg-gray-100 border-gray-200 text-gray-600"
                          }`}
                        >
                          <span>←</span>
                          <span>..</span>
                        </button>
                      )}
                      
                      {repoContents.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => handleFileClick(item)}
                          className={`w-full p-3 text-left hover:bg-opacity-50 transition-colors border-b last:border-b-0 flex items-center space-x-2 ${
                            selectedFile?.path === item.path
                              ? darkMode
                                ? "bg-gray-800 text-white border-gray-600"
                                : "bg-gray-200 text-black border-gray-300"
                              : darkMode 
                              ? "hover:bg-gray-800 border-gray-700 text-gray-100" 
                              : "hover:bg-gray-100 border-gray-200 text-gray-900"
                          }`}
                        >
                          <span>{item.type === "dir" ? "📁" : "📄"}</span>
                          <span className="font-medium">{item.name}</span>
                          {item.type === "file" && item.size && (
                            <span className={`text-xs ml-auto ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              {(item.size / 1024).toFixed(1)}KB
                            </span>
                          )}
                        </button>
                      ))}
                      
                      {repoContents.length === 0 && !isLoading && (
                        <div className={`p-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          No supported files found
                        </div>
                      )}
                      
                      {isLoading && (
                        <div className={`p-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Loading...
                        </div>
                      )}
                    </div>
                    
                    {selectedFile && (
                      <div className={`mt-4 p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <span>📄</span>
                          <span className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                            {selectedFile.name}
                          </span>
                        </div>
                        <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Ready to annotate • {(selectedFile.size / 1024).toFixed(1)}KB
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Language Selection */}
            <div className="mb-8">
              <label
                className={`block text-sm font-medium mb-3 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Programming Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`w-full p-4 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  darkMode
                    ? "bg-black border-gray-700 text-gray-100 focus:ring-gray-600 focus:border-gray-600"
                    : "bg-white border-gray-300 text-gray-900 focus:ring-gray-400 focus:border-gray-400"
                }`}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="typescript">TypeScript</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </select>
            </div>

            {/* Comment Level Selection */}
            <div className="mb-8">
              <label
                className={`block text-sm font-medium mb-4 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Comment Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setCommentLevel("minimal")}
                  className={`p-4 rounded-xl font-medium transition-all border ${
                    commentLevel === "minimal"
                      ? darkMode
                        ? "bg-white text-black border-white"
                        : "bg-black text-white border-black"
                      : darkMode
                      ? "bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold mb-1">Minimal</div>
                    <div className="text-xs opacity-75">Essential only</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCommentLevel("standard")}
                  className={`p-4 rounded-xl font-medium transition-all border ${
                    commentLevel === "standard"
                      ? darkMode
                        ? "bg-white text-black border-white"
                        : "bg-black text-white border-black"
                      : darkMode
                      ? "bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold mb-1">Standard</div>
                    <div className="text-xs opacity-75">Balanced coverage</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCommentLevel("detailed")}
                  className={`p-4 rounded-xl font-medium transition-all border ${
                    commentLevel === "detailed"
                      ? darkMode
                        ? "bg-white text-black border-white"
                        : "bg-black text-white border-black"
                      : darkMode
                      ? "bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold mb-1">Detailed</div>
                    <div className="text-xs opacity-75">Comprehensive docs</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={activeTab === "github" ? handleGitHubSubmit : handleSubmit}
              disabled={
                (activeTab === "github" ? !selectedFile : !pastedCode) || isLoading
              }
              className={`w-full py-4 px-6 rounded-xl font-medium transition-all ${
                (activeTab === "github" ? !selectedFile : !pastedCode) || isLoading
                  ? darkMode
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : darkMode
                  ? "bg-white text-black hover:bg-gray-100"
                  : "bg-black text-white hover:bg-gray-900"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Generate Comments"
              )}
            </button>
          </div>

          {/* Output Section */}
          <div
            className={`rounded-2xl border p-8 ${
              darkMode
                ? "bg-gray-900 border-gray-800"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center mb-8">
              <h2
                className={`text-2xl font-medium ${
                  darkMode ? "text-white" : "text-black"
                }`}
              >
                Output
              </h2>
              {result && (
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    darkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  Copy to Clipboard
                </button>
              )}
            </div>

            {result ? (
              <pre
                className={`rounded-xl p-6 overflow-auto max-h-96 text-sm font-mono border ${
                  darkMode
                    ? "bg-black border-gray-800 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <code>{result}</code>
              </pre>
            ) : (
              <div
                className={`rounded-xl p-12 text-center ${
                  darkMode
                    ? "bg-black border border-gray-800 text-gray-500"
                    : "bg-white border border-gray-300 text-gray-400"
                }`}
              >
                <svg
                  className={`w-16 h-16 mx-auto mb-4 ${
                    darkMode ? "text-gray-600" : "text-gray-300"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>Your annotated code will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
const { useState } = React;

function App() {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pastedCode, setPastedCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [commentLevel, setCommentLevel] = useState("standard");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [darkMode, setDarkMode] = useState(false);

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
              onClick={handleSubmit}
              disabled={!pastedCode || isLoading}
              className={`w-full py-4 px-6 rounded-xl font-medium transition-all ${
                !pastedCode || isLoading
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

const { useState } = React;

function App() {
    const [activeTab, setActiveTab] = useState('upload');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [pastedCode, setPastedCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [commentLevel, setCommentLevel] = useState('detailed');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');

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
        const codeToAnnotate = activeTab === 'upload' ? pastedCode : pastedCode;
        
        try {
            const response = await fetch('/annotate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: codeToAnnotate,
                    language: language
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setResult(data.annotated_code);
            setIsLoading(false);
        } catch (error) {
            console.error('Error annotating code:', error);
            setResult(`Error: ${error.message}\n\nPlease make sure:\n1. The backend server is running on port 8000\n2. Your OpenAI API key is configured\n3. You have an active internet connection`);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        🧠 AI Code Commenter
                    </h1>
                    <p className="text-lg text-gray-600">
                        Automatically add meaningful comments and docstrings to your code
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-2xl font-semibold mb-6">Input Code</h2>
                        
                        {/* Tab Navigation */}
                        <div className="flex mb-6 border-b border-gray-200">
                            <button
                                className={`py-2 px-4 font-medium ${
                                    activeTab === 'upload'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                                onClick={() => setActiveTab('upload')}
                            >
                                📁 Upload File
                            </button>
                            <button
                                className={`py-2 px-4 font-medium ${
                                    activeTab === 'paste'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                                onClick={() => setActiveTab('paste')}
                            >
                                📝 Paste Code
                            </button>
                        </div>

                        {/* File Upload Tab */}
                        {activeTab === 'upload' && (
                            <div className="mb-6">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
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
                                        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <span className="text-lg font-medium text-gray-700">
                                            {uploadedFile ? uploadedFile.name : 'Click to upload a file'}
                                        </span>
                                        <span className="text-sm text-gray-500 mt-2">
                                            Supports: .py, .js, .java, .cpp, .c, .html, .css, .php, .rb, .go, .rs, .ts, .tsx, .jsx
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Paste Code Tab */}
                        {activeTab === 'paste' && (
                            <div className="mb-6">
                                <textarea
                                    value={pastedCode}
                                    onChange={(e) => setPastedCode(e.target.value)}
                                    placeholder="Paste your code here..."
                                    className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        )}

                        {/* Language Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Programming Language
                            </label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Comment Level
                            </label>
                            <div className="flex space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setCommentLevel('minimal')}
                                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                                        commentLevel === 'minimal'
                                            ? 'bg-blue-600 text-white border-2 border-blue-600'
                                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="text-center">
                                        <div className="font-semibold">📝 Minimal</div>
                                        <div className="text-xs mt-1 opacity-80">Essential comments only</div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCommentLevel('detailed')}
                                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                                        commentLevel === 'detailed'
                                            ? 'bg-blue-600 text-white border-2 border-blue-600'
                                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="text-center">
                                        <div className="font-semibold">📚 Detailed</div>
                                        <div className="text-xs mt-1 opacity-80">Comprehensive documentation</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!pastedCode || isLoading}
                            className={`w-full py-3 px-6 rounded-lg font-medium ${
                                !pastedCode || isLoading
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 transition-colors'
                            }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Annotating...
                                </span>
                            ) : (
                                '🧠 Add Comments & Docstrings'
                            )}
                        </button>
                    </div>

                    {/* Output Section */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">Annotated Code</h2>
                            {result && (
                                <button
                                    onClick={() => navigator.clipboard.writeText(result)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    📋 Copy
                                </button>
                            )}
                        </div>

                        {result ? (
                            <pre className="bg-gray-100 rounded-lg p-4 overflow-auto max-h-96 text-sm font-mono">
                                <code>{result}</code>
                            </pre>
                        ) : (
                            <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

ReactDOM.render(<App />, document.getElementById('root'));
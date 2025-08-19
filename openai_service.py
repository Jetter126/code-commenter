import openai
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class OpenAIService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            self.client = openai.OpenAI(api_key=api_key)
        else:
            self.client = None
    
    def annotate_python_code(self, code: str, language: str = "python") -> str:
        """
        Annotates code with meaningful comments and docstrings.
        
        Args:
            code (str): The source code to annotate
            language (str): The programming language (default: python)
            
        Returns:
            str: The annotated code with comments and docstrings
        """
        
        prompt = self._create_annotation_prompt(code, language)
        
        if not self.client:
            raise Exception("OpenAI API key not configured")
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-5-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert code reviewer and documentation specialist. Your task is to add meaningful inline comments and docstrings to source code to improve readability and maintainability."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_completion_tokens=2000,
                # temperature=0.3
            )
            
            annotated_code = response.choices[0].message.content.strip()
            
            # Remove markdown code block formatting if present
            if annotated_code.startswith("```"):
                lines = annotated_code.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1] == "```":
                    lines = lines[:-1]
                annotated_code = "\n".join(lines)
            
            return annotated_code
            
        except Exception as e:
            raise Exception(f"Error calling OpenAI API: {str(e)}")
    
    def _create_annotation_prompt(self, code: str, language: str) -> str:
        """
        Creates a detailed prompt for code annotation based on the programming language.
        
        Args:
            code (str): The source code
            language (str): The programming language
            
        Returns:
            str: The formatted prompt
        """
        
        if language.lower() == "python":
            return f"""
Please add meaningful comments and docstrings to the following Python code. Follow these guidelines:

1. Add Google-style docstrings for all functions and classes
2. Include inline comments for complex logic, loops, and important operations
3. Explain the purpose of variables when not obvious
4. Add comments for error handling and edge cases
5. Keep existing code structure intact
6. Use clear, concise language
7. Don't add redundant comments for obvious operations

Here's the Python code to annotate:

```python
{code}
```

Return only the annotated code without any additional explanation or markdown formatting.
"""
        else:
            return f"""
Please add meaningful comments and docstrings to the following {language} code. Follow these guidelines:

1. Add appropriate documentation comments for functions and classes (language-specific style)
2. Include inline comments for complex logic, loops, and important operations  
3. Explain the purpose of variables when not obvious
4. Add comments for error handling and edge cases
5. Keep existing code structure intact
6. Use clear, concise language
7. Don't add redundant comments for obvious operations

Here's the {language} code to annotate:

```
{code}
```

Return only the annotated code without any additional explanation or markdown formatting.
"""
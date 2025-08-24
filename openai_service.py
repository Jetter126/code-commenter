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
    
    def annotate_code(self, code: str, language: str = "python", comment_level: str = "standard") -> str:
        """
        Annotates code with meaningful comments and docstrings.
        
        Args:
            code (str): The source code to annotate
            language (str): The programming language (default: python)
            comment_level (str): Level of comments - "minimal", "standard", or "detailed" (default: standard)
            
        Returns:
            str: The annotated code with comments and docstrings
        """
        
        prompt = self._create_annotation_prompt(code, language, comment_level)
        
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
    
    def _create_annotation_prompt(self, code: str, language: str, comment_level: str = "standard") -> str:
        """
        Creates a prompt for code annotation based on the programming language and comment level.
        
        Args:
            code (str): The source code
            language (str): The programming language
            comment_level (str): Level of comments - "minimal", "standard", or "detailed"
            
        Returns:
            str: The formatted prompt
        """
        
        if language.lower() == "python":
            if comment_level == "minimal":
                return f"""
Please add minimal, essential comments to the following Python code. Follow these guidelines:

1. Add brief docstrings only for functions and classes that aren't self-explanatory
2. Add inline comments only for complex or non-obvious logic
3. Keep comments concise and to the point
4. Focus on WHAT the code does, not HOW
5. Avoid obvious comments
6. Keep existing code structure intact

Here's the Python code to annotate:

```python
{code}
```

Return only the annotated code without any additional explanation or markdown formatting.
"""
            elif comment_level == "standard":
                return f"""
Please add standard-level comments to the following Python code. Follow these guidelines:

1. Add brief docstrings for functions and classes that need clarification:
   - Simple description of purpose
   - Main parameters only if not obvious
   - Return value if complex
2. Include inline comments sparingly for:
   - Complex logic or algorithms only
   - Business logic decisions
   - Non-obvious calculations
3. Skip obvious comments - let clear code speak for itself
4. Keep comments concise and practical
5. Keep existing code structure intact

Here's the Python code to annotate:

```python
{code}
```

Return only the annotated code without any additional explanation or markdown formatting.
"""
            else:  # detailed
                return f"""
Please add comprehensive comments and docstrings to the following Python code. Follow these guidelines:

1. Add detailed Google-style docstrings for all functions and classes with:
   - Description of purpose
   - Args with types and descriptions
   - Returns with type and description
   - Raises for exceptions (if applicable)
2. Include detailed inline comments explaining:
   - Complex logic and algorithms
   - Business logic and decision points
   - Loop purposes and conditions
   - Variable purposes when not obvious
3. Add comments for error handling and edge cases
4. Explain WHY decisions were made, not just WHAT the code does
5. Keep existing code structure intact
6. Use clear, comprehensive language

Here's the Python code to annotate:

```python
{code}
```

Return only the annotated code without any additional explanation or markdown formatting.
"""
        else:
            if comment_level == "minimal":
                return f"""
Please add minimal, essential comments to the following {language} code. Follow these guidelines:

1. Add brief documentation comments only for functions and classes that aren't self-explanatory
2. Add inline comments only for complex or non-obvious logic
3. Keep comments concise and to the point
4. Focus on WHAT the code does, not HOW
5. Avoid obvious comments
6. Keep existing code structure intact
7. Use language-appropriate comment syntax

Here's the {language} code to annotate:

```
{code}
```

Return only the annotated code without any additional explanation or markdown formatting.
"""
            elif comment_level == "standard":
                return f"""
Please add standard-level comments to the following {language} code. Follow these guidelines:

1. Add brief documentation comments for functions and classes that need clarification:
   - Simple description of purpose
   - Main parameters only if not obvious
   - Return value if complex
2. Include inline comments sparingly for:
   - Complex logic or algorithms only
   - Business logic decisions
   - Non-obvious operations
3. Skip obvious comments - let clear code speak for itself
4. Keep comments concise and practical
5. Keep existing code structure intact
6. Use language-appropriate comment syntax

Here's the {language} code to annotate:

```
{code}
```

Return only the annotated code without any additional explanation or markdown formatting.
"""
            else:  # detailed
                return f"""
Please add comprehensive comments and docstrings to the following {language} code. Follow these guidelines:

1. Add detailed documentation comments for all functions and classes using language-specific style:
   - Description of purpose and functionality
   - Parameter descriptions with types
   - Return value descriptions
   - Exception information where applicable
2. Include detailed inline comments explaining:
   - Complex logic and algorithms
   - Business logic and decision points
   - Loop purposes and conditions
   - Variable purposes when not obvious
3. Add comments for error handling and edge cases
4. Explain WHY decisions were made, not just WHAT the code does
5. Keep existing code structure intact
6. Use language-appropriate comment syntax and conventions

Here's the {language} code to annotate:

```
{code}
```

Return only the annotated code without any additional explanation or markdown formatting.
"""
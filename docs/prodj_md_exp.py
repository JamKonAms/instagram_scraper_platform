import os
from datetime import datetime
import math

def count_tokens(text):
    # Rough estimation: ~4 characters per token
    return len(text) // 4

def create_project_documentation():
    print("Starting documentation creation...")
    
    # Get timestamp for filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    
    # Get the project root directory (2 levels up from the script)
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Directories to exclude
    exclude_dirs = {
        'node_modules',
        '.git',
        'dist',
        'build',
        'coverage',
        '__pycache__',
        '.pytest_cache',
        '.vscode'
    }
    
    # List all relevant files in the project
    files_to_document = []
    for root, dirs, files in os.walk(project_root):
        # Remove excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            # Exclude package-lock.json and other non-essential files
            if (file.endswith(('.js', '.md', '.sh', '.env', '.gitignore')) and 
                not file in {'package-lock.json', 'package.json'}):
                rel_path = os.path.relpath(os.path.join(root, file), project_root)
                files_to_document.append(rel_path)
    
    print(f"Found {len(files_to_document)} files to document")
    
    # Generate full content first
    full_content = []
    for file_path in files_to_document:
        full_path = os.path.join(project_root, file_path)
        print(f"Processing file: {file_path}")
        
        file_content = f"\n## File: {file_path}\n"
        file_content += "```" + get_file_extension(file_path) + "\n"
        
        try:
            with open(full_path, 'r') as source_file:
                content = source_file.read()
                file_content += content
                print(f"Successfully read contents of {file_path}")
        except Exception as e:
            error_msg = f"Error reading file {file_path}: {str(e)}"
            print(error_msg)
            file_content += error_msg
        
        file_content += "\n```\n"
        full_content.append(file_content)
    
    # Join all content
    complete_content = "# Instagram Scraper Platform - Full Codebase\n\n" + "".join(full_content)
    
    # Calculate total tokens and number of needed files
    total_tokens = count_tokens(complete_content)
    tokens_per_file = 4000
    num_files = math.ceil(total_tokens / tokens_per_file)
    
    print(f"Total tokens: {total_tokens}")
    print(f"Will split into {num_files} files")
    
    if num_files == 1:
        # Single file output
        output_path = os.path.join(project_root, 'docs', f'FULL_PROJECT_{timestamp}.md')
        with open(output_path, 'w') as md_file:
            md_file.write(complete_content)
        print(f"Created single file: {output_path}")
    else:
        # Split content into multiple files
        content_per_file = len(complete_content) // num_files
        for i in range(num_files):
            start_idx = i * content_per_file
            end_idx = start_idx + content_per_file if i < num_files - 1 else len(complete_content)
            
            part_content = complete_content[start_idx:end_idx]
            output_path = os.path.join(
                project_root, 
                'docs', 
                f'FULL_PROJECT_{timestamp}_part_{i+1}_of_{num_files}.md'
            )
            
            with open(output_path, 'w') as md_file:
                md_file.write(part_content)
            print(f"Created part {i+1} of {num_files}: {output_path}")
    
    print("Documentation creation completed!")

def get_file_extension(filename):
    if filename.endswith('.js'):
        return 'javascript'
    elif filename.endswith('.json'):
        return 'json'
    elif filename.endswith('.env'):
        return 'bash'
    elif filename.endswith('.gitignore'):
        return 'bash'
    elif filename.endswith('.sh'):
        return 'bash'
    elif filename.endswith('.md'):
        return 'markdown'
    else:
        return ''

if __name__ == "__main__":
    create_project_documentation()
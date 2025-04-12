document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileCount = document.getElementById('fileCount');
    const fileList = document.getElementById('fileList');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const conversionLog = document.getElementById('conversionLog');
    const commandInput = document.querySelector('.command-input');
    
    let selectedFiles = [];

    // Initialize PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    // Command line functionality
    commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const command = commandInput.textContent.trim();
            handleCommand(command);
            commandInput.textContent = '';
        }
    });

    function handleCommand(command) {
        const args = command.split(' ');
        const cmd = args[0].toLowerCase();

        switch (cmd) {
            case 'convert':
                convertFiles();
                break;
            case 'clear':
                clearFiles();
                break;
            case 'help':
                addLogEntry('Available commands:', 'info');
                addLogEntry('convert - Convert all selected PDF files to TXT', 'info');
                addLogEntry('clear - Clear all selected files', 'info');
                addLogEntry('help - Show this help message', 'info');
                break;
            default:
                addLogEntry(`Unknown command: ${cmd}. Type 'help' for available commands.`, 'error');
        }
    }

    // File upload handling
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        selectedFiles = Array.from(e.target.files);
        updateFileList();
        updateFileCount();
    });

    function updateFileList() {
        fileList.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
            `;
            fileList.appendChild(fileItem);
        });
    }

    function updateFileCount() {
        const count = selectedFiles.length;
        fileCount.textContent = count === 0 ? 'No files selected' : `${count} file${count !== 1 ? 's' : ''} selected`;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // PDF to TXT conversion
    convertBtn.addEventListener('click', convertFiles);

    async function convertFiles() {
        if (selectedFiles.length === 0) {
            addLogEntry('No files selected for conversion', 'error');
            return;
        }

        addLogEntry(`Starting conversion of ${selectedFiles.length} PDF files...`, 'info');

        for (const file of selectedFiles) {
            try {
                addLogEntry(`Processing ${file.name}...`, 'info');
                
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                
                addLogEntry(`PDF loaded successfully. Number of pages: ${pdf.numPages}`, 'info');
                
                let extractedText = '';

                // Extract text from each page
                for (let i = 1; i <= pdf.numPages; i++) {
                    addLogEntry(`Processing page ${i} of ${pdf.numPages}...`, 'info');
                    
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    extractedText += pageText + '\n\n';
                    
                    addLogEntry(`Page ${i} processed successfully`, 'success');
                }

                // Create and download the TXT file
                const blob = new Blob([extractedText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name.replace('.pdf', '.txt');
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                addLogEntry(`Successfully converted: ${file.name} -> ${a.download}`, 'success');
            } catch (error) {
                addLogEntry(`Error converting ${file.name}: ${error.message}`, 'error');
                console.error('Conversion error:', error);
            }
        }
    }

    // Clear functionality
    clearBtn.addEventListener('click', clearFiles);

    function clearFiles() {
        selectedFiles = [];
        fileInput.value = '';
        updateFileList();
        updateFileCount();
        addLogEntry('All files cleared', 'info');
    }

    function addLogEntry(message, type) {
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        conversionLog.appendChild(entry);
        conversionLog.scrollTop = conversionLog.scrollHeight;
    }

    // Initial help message
    addLogEntry('Type "help" in the command line for available commands', 'info');
}); 
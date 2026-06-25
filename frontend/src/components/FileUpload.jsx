import { useRef, useState } from 'react'

function FileUpload({ onFileSelect }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState(null)

  function handleFile(file) {
    if (!file) return
    setFileName(file.name)
    onFileSelect?.(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <div
      className={`file-upload ${isDragging ? 'dragging' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <p className="file-upload-text">
        {fileName ? fileName : 'Drag & drop a CSV file here, or click to upload'}
      </p>
      <p className="file-upload-hint">date / product / category / amount</p>
    </div>
  )
}

export default FileUpload

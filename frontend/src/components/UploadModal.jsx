import FileUpload from './FileUpload'

function UploadModal({ onClose, onFileSelect }) {
  function handleFileSelect(file) {
    onFileSelect?.(file)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>Upload CSV</h2>
        <FileUpload onFileSelect={handleFileSelect} />
      </div>
    </div>
  )
}

export default UploadModal

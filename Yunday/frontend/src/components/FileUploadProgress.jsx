import './FileUploadProgress.css'

export default function FileUploadProgress({ upload }) {
  return (
    <div className={`upload-item ${upload.done ? 'done' : ''}`}>
      <span className="upload-name">{upload.name}</span>
      <div className="upload-bar-wrapper">
        <div className="upload-bar" style={{ width: `${upload.progress}%` }} />
      </div>
      <span className="upload-pct">{upload.done ? '✓' : `${upload.progress}%`}</span>
    </div>
  )
}

import { useState } from 'react';

function UrlSelection({ initialUrls, baseUrl, onContinue, onBack }) {
  const [urlList, setUrlList] = useState(() => {
    return initialUrls.map((item, idx) => ({
      id: `url-${idx}-${Date.now()}`,
      url: item.url || item.href || '',
      text: item.text || '',
      source: item.source || 'body',
      selected: true
    }));
  });

  const [newUrl, setNewUrl] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Extract base domain origin (e.g., https://example.com)
  const getOrigin = (urlStr) => {
    try {
      const url = new URL(urlStr);
      return url.origin;
    } catch (e) {
      if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
        return urlStr;
      }
      return baseUrl;
    }
  };

  const origin = getOrigin(baseUrl);

  // Toggle selection
  const handleToggleSelect = (id) => {
    setUrlList(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  // Select / Unselect All
  const allSelected = urlList.length > 0 && urlList.every(item => item.selected);
  const handleToggleSelectAll = () => {
    setUrlList(prev => prev.map(item => ({ ...item, selected: !allSelected })));
  };

  // Add Custom URL
  const handleAddUrl = (e) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    let formattedUrl = newUrl.trim();
    // Normalize relative paths
    if (formattedUrl.startsWith('/')) {
      formattedUrl = `${origin}${formattedUrl}`;
    } else if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `${origin}/${formattedUrl}`;
    }

    // Validate format
    try {
      new URL(formattedUrl);
    } catch (err) {
      alert('Please enter a valid URL or path (e.g. /about or https://example.com/about)');
      return;
    }

    // Check duplicate
    if (urlList.some(item => item.url.replace(/\/+$/, '') === formattedUrl.replace(/\/+$/, ''))) {
      alert('This URL is already in the list.');
      return;
    }

    setUrlList(prev => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        url: formattedUrl,
        text: newUrl.trim(),
        source: 'custom',
        selected: true
      }
    ]);
    setNewUrl('');
  };

  // Delete URL
  const handleDeleteUrl = (id) => {
    setUrlList(prev => prev.filter(item => item.id !== id));
  };

  // Start Inline Edit
  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditingText(item.url);
  };

  // Save Inline Edit
  const handleSaveEdit = (id) => {
    if (!editingText.trim()) return;

    let formattedUrl = editingText.trim();
    if (formattedUrl.startsWith('/')) {
      formattedUrl = `${origin}${formattedUrl}`;
    } else if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `${origin}/${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
    } catch (err) {
      alert('Please enter a valid URL.');
      return;
    }

    setUrlList(prev => prev.map(item => 
      item.id === id ? { ...item, url: formattedUrl, text: editingText.trim() } : item
    ));
    setEditingId(null);
  };

  // Cancel Inline Edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  // Proceed
  const handleContinue = () => {
    const selectedUrls = urlList.filter(item => item.selected).map(item => ({
      url: item.url,
      text: item.text,
      source: item.source
    }));
    if (selectedUrls.length === 0) {
      alert('Please select at least one URL to test.');
      return;
    }
    onContinue(selectedUrls);
  };

  const selectedCount = urlList.filter(item => item.selected).length;

  return (
    <div className="url-selection-container">
      <div className="url-selection__header">
        <h2 className="url-selection__title">Verify URLs to Test</h2>
        <p className="url-selection__desc">
          We found the following links on <strong>{origin}</strong>. Customize this list by selecting, editing, deleting, or adding custom paths before starting the quality analysis.
        </p>
      </div>

      {/* Add Custom URL Form */}
      <form className="url-selection-add-row" onSubmit={handleAddUrl}>
        <input 
          type="text" 
          placeholder="Add custom path or URL (e.g. /pricing, /about-us, or full external link)"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
        />
        <button type="submit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          ADD URL
        </button>
      </form>

      {/* Select All Checkbox */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 10px 20px' }}>
        <label className="url-selection-checkbox">
          <input 
            type="checkbox" 
            checked={allSelected} 
            onChange={handleToggleSelectAll}
          />
          <span className="url-selection-checkbox__checkmark"></span>
          <span style={{ marginLeft: '10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            SELECT ALL ({urlList.length} total)
          </span>
        </label>
        <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
          {selectedCount} Selected for Testing
        </span>
      </div>

      {/* URL List */}
      <div className="url-selection-list">
        {urlList.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No URLs added. Add custom URLs above to begin testing.
          </div>
        ) : (
          urlList.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <div 
                key={item.id} 
                className={`url-selection-item ${!item.selected ? 'url-selection-item--disabled' : ''}`}
              >
                {/* Checkbox */}
                <label className="url-selection-checkbox">
                  <input 
                    type="checkbox" 
                    checked={item.selected}
                    onChange={() => handleToggleSelect(item.id)}
                    disabled={isEditing}
                  />
                  <span className="url-selection-checkbox__checkmark"></span>
                </label>

                {/* Content */}
                <div className="url-selection-content">
                  {isEditing ? (
                    <input 
                      type="text" 
                      className="url-selection-edit-input"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="url-selection-url-text" title={item.url}>
                      {item.url}
                    </span>
                  )}
                </div>

                {/* Badge Source */}
                <span className={`badge-source badge-source--${item.source}`}>
                  {item.source}
                </span>

                {/* Actions */}
                <div className="url-selection-actions">
                  {isEditing ? (
                    <>
                      <button 
                        className="btn-icon-action btn-icon-action--save" 
                        onClick={() => handleSaveEdit(item.id)}
                        title="Save Changes"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </button>
                      <button 
                        className="btn-icon-action" 
                        onClick={handleCancelEdit}
                        title="Cancel"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="btn-icon-action" 
                        onClick={() => handleStartEdit(item)}
                        title="Edit URL"
                        disabled={!item.selected}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </button>
                      <button 
                        className="btn-icon-action btn-icon-action--delete" 
                        onClick={() => handleDeleteUrl(item.id)}
                        title="Delete URL"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="url-selection-footer">
        <button className="url-selection-footer__back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: 'rotate(180deg)' }}>
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
          BACK TO HOME
        </button>

        <button 
          className="url-selection-footer__start" 
          onClick={handleContinue}
          disabled={selectedCount === 0}
        >
          CONTINUE & START ({selectedCount} URLs)
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default UrlSelection;

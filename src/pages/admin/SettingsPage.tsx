import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';
import { storage, db } from '../../firebase/firebase';
import { useTenant } from '../../context/TenantContext';
import './SettingsPage.css';

export function SettingsPage() {
    const { currentTenant, updateAppData } = useTenant();

    const [logoUrl, setLogoUrl] = useState(currentTenant?.settings.logoUrl || '');
    const [backgroundUrl, setBackgroundUrl] = useState(currentTenant?.settings.backgroundUrl || '');
    const [publicPhone, setPublicPhone] = useState(currentTenant?.settings.publicPhone || '');
    const [publicEmail, setPublicEmail] = useState(currentTenant?.settings.publicEmail || '');
    const [uploading, setUploading] = useState<'logo' | 'background' | null>(null);
    const [uploadProgress, setUploadProgress] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);

    if (!currentTenant) {
        return <div>Loading...</div>;
    }

    const compressImage = async (file: File, type: 'logo' | 'background'): Promise<File> => {
        const options = {
            maxSizeMB: type === 'logo' ? 0.2 : 0.5, // Logo: 200KB, Background: 500KB
            maxWidthOrHeight: type === 'logo' ? 400 : 1920, // Logo: 400px, Background: 1920px
            useWebWorker: true,
            fileType: 'image/webp' as const, // Convert to WebP for better compression
        };

        setUploadProgress('Compressing...');
        try {
            const compressedFile = await imageCompression(file, options);
            console.log(`Compressed from ${(file.size / 1024).toFixed(1)}KB to ${(compressedFile.size / 1024).toFixed(1)}KB`);
            return compressedFile;
        } catch (error) {
            console.warn('Compression failed, using original:', error);
            return file;
        }
    };

    const handleUpload = async (file: File, type: 'logo' | 'background') => {
        if (!file) return;

        setUploading(type);
        setUploadProgress('Preparing...');

        try {
            // Compress the image
            const compressedFile = await compressImage(file, type);

            // Use .webp extension since we're converting to WebP
            const fileName = `${currentTenant.id}/${type}.webp`;
            const storageRef = ref(storage, `tenants/${fileName}`);

            setUploadProgress('Uploading...');

            // Upload with cache-control metadata for long-term caching (1 year)
            await uploadBytes(storageRef, compressedFile, {
                contentType: 'image/webp',
                cacheControl: 'public, max-age=31536000, immutable',
            });

            const downloadUrl = await getDownloadURL(storageRef);

            if (type === 'logo') {
                setLogoUrl(downloadUrl);
            } else {
                setBackgroundUrl(downloadUrl);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploading(null);
            setUploadProgress('');
        }
    };

    const handleRemoveImage = async (type: 'logo' | 'background') => {
        try {
            const url = type === 'logo' ? logoUrl : backgroundUrl;
            if (url) {
                // Extract the path from the URL and delete from storage
                const urlPath = decodeURIComponent(url.split('/o/')[1]?.split('?')[0] || '');
                if (urlPath) {
                    const storageRef = ref(storage, urlPath);
                    await deleteObject(storageRef).catch(() => {
                        // Ignore errors if file doesn't exist
                    });
                }
            }

            if (type === 'logo') {
                setLogoUrl('');
            } else {
                setBackgroundUrl('');
            }
        } catch (error) {
            console.error('Remove failed:', error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);

        try {
            const updatedSettings = {
                ...currentTenant.settings,
                logoUrl: logoUrl || undefined,
                backgroundUrl: backgroundUrl || undefined,
                publicPhone: publicPhone || undefined,
                publicEmail: publicEmail || undefined,
            };

            // Update Firestore
            await updateDoc(doc(db, 'tenants', currentTenant.id), {
                settings: updatedSettings,
            });

            // Update local state
            updateAppData((data) => ({
                ...data,
                tenants: data.tenants.map((t) =>
                    t.id === currentTenant.id
                        ? { ...t, settings: { ...updatedSettings, logoUrl, backgroundUrl } }
                        : t
                ),
            }));

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'background') => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file.');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image must be less than 5MB.');
                return;
            }
            handleUpload(file, type);
        }
    };

    return (
        <div className="settings-page">
            <div className="page-header">
                <h2>Settings</h2>
                <p>Customize your booking page appearance</p>
            </div>

            <div className="settings-section">
                <h3>Branding</h3>
                <p>Upload your logo and background image to personalize the booking experience for your customers.</p>

                <div className="image-upload-grid">
                    <div className="upload-item">
                        <label>Logo</label>
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileChange(e, 'logo')}
                        />
                        <div
                            className={`upload-area ${logoUrl ? 'has-image' : ''}`}
                            onClick={() => !uploading && logoInputRef.current?.click()}
                        >
                            {uploading === 'logo' ? (
                                <div className="upload-progress">
                                    <span>{uploadProgress || 'Uploading...'}</span>
                                </div>
                            ) : logoUrl ? (
                                <div className="preview-container">
                                    <img src={logoUrl} alt="Logo preview" className="preview-image logo" />
                                    <button
                                        className="remove-btn"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveImage('logo'); }}
                                        title="Remove logo"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="upload-icon">🖼️</span>
                                    <span>Click to upload logo</span>
                                    <small>PNG, JPG up to 5MB</small>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="upload-item">
                        <label>Background Image</label>
                        <input
                            ref={bgInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileChange(e, 'background')}
                        />
                        <div
                            className={`upload-area ${backgroundUrl ? 'has-image' : ''}`}
                            onClick={() => !uploading && bgInputRef.current?.click()}
                        >
                            {uploading === 'background' ? (
                                <div className="upload-progress">
                                    <span>{uploadProgress || 'Uploading...'}</span>
                                </div>
                            ) : backgroundUrl ? (
                                <div className="preview-container">
                                    <img src={backgroundUrl} alt="Background preview" className="preview-image" />
                                    <button
                                        className="remove-btn"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveImage('background'); }}
                                        title="Remove background"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="upload-icon">🏞️</span>
                                    <span>Click to upload background</span>
                                    <small>PNG, JPG up to 5MB</small>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="contact-settings">
                    <h3>Footer Contact Info</h3>
                    <p>Optional contact information displayed in the footer of your booking page.</p>

                    <div className="form-group">
                        <label htmlFor="publicPhone">Phone Number</label>
                        <input
                            id="publicPhone"
                            type="tel"
                            value={publicPhone}
                            onChange={(e) => setPublicPhone(e.target.value)}
                            placeholder="e.g., +1 234 567 8900"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="publicEmail">Email Address</label>
                        <input
                            id="publicEmail"
                            type="email"
                            value={publicEmail}
                            onChange={(e) => setPublicEmail(e.target.value)}
                            placeholder="e.g., contact@yourbusiness.com"
                        />
                    </div>
                </div>

                <div className="settings-actions">
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    {saved && (
                        <span className="save-success">
                            ✓ Settings saved successfully!
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

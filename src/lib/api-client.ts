const API_BASE = '/api';

export interface UploadImageResult {
  success: boolean;
  url?: string;
  deleteUrl?: string;
  error?: string;
}

export async function uploadImageViaApi(imageData: string): Promise<UploadImageResult> {
  try {
    const response = await fetch(`${API_BASE}/upload-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageData }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Upload failed' };
    }

    return {
      success: true,
      url: data.url,
      deleteUrl: data.deleteUrl,
    };
  } catch (error) {
    console.error('API upload error:', error);
    return { success: false, error: 'Network error during upload' };
  }
}

export interface GenerateDescriptionResult {
  success: boolean;
  description?: string;
  error?: string;
}

export interface GenerateDescriptionParams {
  name: string;
  category: string;
  price: number;
}

export async function generateDescriptionViaApi(
  params: GenerateDescriptionParams
): Promise<GenerateDescriptionResult> {
  try {
    const response = await fetch(`${API_BASE}/generate-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Generation failed' };
    }

    return {
      success: true,
      description: data.description,
    };
  } catch (error) {
    console.error('API generation error:', error);
    return { success: false, error: 'Network error during generation' };
  }
}

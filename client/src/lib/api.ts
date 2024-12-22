export interface MessageResponse {
  id: number;
  received: string;
  serverResponse: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  details?: any;
  message?: string;
}

const API_BASE = '/api';

export async function sendMessage(message: string): Promise<MessageResponse> {
  const response = await fetch(`${API_BASE}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send message');
  }

  return response.json();
}

export async function getMessages(limit: number = 10): Promise<MessageResponse[]> {
  const response = await fetch(`${API_BASE}/messages?limit=${limit}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch messages');
  }

  return response.json();
}

/**
 * Mock Services for Web Demo
 * Provides placeholder implementations for native features
 */

import { DEMO_USER, DEMO_SESSION, DEMO_SUBSCRIPTION } from '../config/webDemo';

// Generate placeholder base64 image (simple 1x1 transparent PNG)
const PLACEHOLDER_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Generate a demo tattoo design (simulated)
function generateDemoDesign(description?: string): string {
  // Return a placeholder base64 image
  // In real demo, you could use a pre-generated sample image
  return PLACEHOLDER_IMAGE_BASE64;
}

// Mock AI Service
export const mockAiService = {
  async generateTattooDesignWithLineart(options: {
    description?: string;
    imageUri?: string;
    highRes?: boolean;
  }): Promise<{ svg: string; base64: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const base64 = generateDemoDesign(options.description);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
  <image width="1200" height="1200" href="data:image/png;base64,${base64}"/>
</svg>`;
    
    return { svg, base64 };
  },
  
  async processImageForAPI(imageUri: string): Promise<string> {
    // Just return the URI for web demo
    return imageUri;
  },
};

// Mock History Service
const mockGenerations = [
  {
    id: '1',
    user_id: DEMO_USER.id,
    description: 'Dragon tattoo design',
    image_base64: PLACEHOLDER_IMAGE_BASE64,
    thumbnail_base64: PLACEHOLDER_IMAGE_BASE64,
    svg_content: '<svg>...</svg>',
    width: 2400,
    height: 2400,
    dpi: 300,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    user_id: DEMO_USER.id,
    description: 'Geometric mandala pattern',
    image_base64: PLACEHOLDER_IMAGE_BASE64,
    thumbnail_base64: PLACEHOLDER_IMAGE_BASE64,
    svg_content: '<svg>...</svg>',
    width: 2400,
    height: 2400,
    dpi: 300,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    user_id: DEMO_USER.id,
    description: 'Floral sleeve design',
    image_base64: PLACEHOLDER_IMAGE_BASE64,
    thumbnail_base64: PLACEHOLDER_IMAGE_BASE64,
    svg_content: '<svg>...</svg>',
    width: 2400,
    height: 2400,
    dpi: 300,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockHistoryService = {
  async saveGenerationLocally(generation: any): Promise<string> {
    const id = `demo-${Date.now()}`;
    mockGenerations.unshift({
      id,
      ...generation,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return id;
  },
  
  async getGenerations(page: number = 0, pageSize: number = 20): Promise<{
    data: any[];
    hasMore: boolean;
  }> {
    const start = page * pageSize;
    const end = start + pageSize;
    return {
      data: mockGenerations.slice(start, end),
      hasMore: end < mockGenerations.length,
    };
  },
  
  async getGenerationImage(id: string): Promise<string | null> {
    const gen = mockGenerations.find(g => g.id === id);
    return gen?.image_base64 || null;
  },
  
  async deleteGeneration(id: string): Promise<void> {
    const index = mockGenerations.findIndex(g => g.id === id);
    if (index !== -1) {
      mockGenerations.splice(index, 1);
    }
  },
};

// Mock Auth Service
export const mockAuth = {
  async getSession() {
    return { data: { session: DEMO_SESSION }, error: null };
  },
  
  async getUser() {
    return { data: { user: DEMO_USER }, error: null };
  },
  
  async signIn(email: string, password: string) {
    // Always succeed in demo
    return { data: { session: DEMO_SESSION, user: DEMO_USER }, error: null };
  },
  
  async signUp(email: string, password: string) {
    // Always succeed in demo
    return { data: { session: DEMO_SESSION, user: DEMO_USER }, error: null };
  },
  
  async signOut() {
    return { error: null };
  },
};

// Mock Subscription Service
export const mockSubscription = {
  async getCustomerInfo() {
    return {
      entitlements: {
        active: {
          pro: {
            isActive: true,
            willRenew: true,
          },
        },
      },
    };
  },
  
  async getOfferings() {
    return {
      availablePackages: [
        {
          identifier: 'pro_monthly',
          packageType: 'MONTHLY',
          product: {
            identifier: 'pro_monthly',
            title: 'Pro Monthly',
            price: '$9.99',
          },
        },
      ],
    };
  },
};

// Mock Print Service
export const mockPrintService = {
  async scanBluetoothPrinters() {
    return [
      { name: 'Demo Printer 1', address: '00:11:22:33:44:55' },
      { name: 'Demo Printer 2', address: '00:11:22:33:44:56' },
    ];
  },
  
  async printViaBluetooth(address: string, imageUri: string) {
    // Simulate print
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },
  
  async printViaWiFi(base64: string) {
    // Simulate print
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },
  
  async shareDesign(base64: string, filename: string) {
    // Use Web Share API if available
    if (navigator.share) {
      const blob = await fetch(`data:image/png;base64,${base64}`).then(r => r.blob());
      await navigator.share({
        title: 'Tattoo Design',
        files: [new File([blob], filename, { type: 'image/png' })],
      });
    } else {
      // Fallback: download
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${base64}`;
      link.download = filename;
      link.click();
    }
  },
  
  getAvailablePrintOptions() {
    return {
      bluetooth: false, // Disabled for web
      wifi: true,
      share: true,
    };
  },
};

// jest.setup.js
import '@testing-library/jest-dom';

// 1. Web Streams API 폴리필 추가 (WritableStream 등)
import { WritableStream, ReadableStream, TransformStream } from 'node:stream/web';

Object.defineProperties(global, {
    WritableStream: { value: WritableStream },
    ReadableStream: { value: ReadableStream },
    TransformStream: { value: TransformStream },
});

// 2. 이전에 추가했던 BroadcastChannel 폴리필
if (typeof global.BroadcastChannel === 'undefined') {
    global.BroadcastChannel = class {
        constructor(name) { this.name = name; }
        postMessage(message) {}
        onmessage = null;
        close() {}
        addEventListener() {}
        removeEventListener() {}
    };
}

// 3. fetch 및 TextEncoder 폴리필 (중요)
import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

if (!Element.prototype.scrollTo) {
    Element.prototype.scrollTo = jest.fn();
}

// 4. Next.js useRouter 모킹 (AuthProvider, MetadataProvider에서 사용)
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        pathname: '/',
        query: {},
        asPath: '/',
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({ slug: ['MAIN_PAGE'], screenId: 'MAIN_PAGE' }),
}));
import { createLocalEntityHandler, invokeLocalFunction } from '@/lib/localBase44Storage';
import { getAdminGoogleEmail } from '@/lib/customAuth';

// Local Entities Handler Proxy
const localEntitiesProxy = new Proxy({}, {
  get(_target, entityName) {
    return createLocalEntityHandler(String(entityName));
  },
});

// Local Functions Handler
const localFunctions = {
  invoke: async (functionName, payload) => {
    return invokeLocalFunction(functionName, payload);
  },
};

// Local Auth Handler
const localAuth = {
  me: async () => {
    const email = getAdminGoogleEmail();
    return {
      id: 'user_admin',
      email,
      full_name: 'Professor William',
      role: 'admin',
    };
  },
};

// Local File/Media Upload Integrations
const localIntegrations = {
  Core: {
    UploadFile: async ({ file }) => {
      if (!file) return { file_url: '' };
      try {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ file_url: reader.result });
          reader.onerror = () => resolve({ file_url: URL.createObjectURL(file) });
          reader.readAsDataURL(file);
        });
      } catch {
        return { file_url: URL.createObjectURL(file) };
      }
    },
  },
};

const localServiceRole = {
  entities: localEntitiesProxy,
  functions: localFunctions,
  integrations: localIntegrations,
};

// 404-free Client Interface providing resilient local storage and functions
export const base44 = {
  entities: localEntitiesProxy,
  functions: localFunctions,
  auth: localAuth,
  integrations: localIntegrations,
  asServiceRole: localServiceRole,
};

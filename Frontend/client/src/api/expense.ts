import { apiClient } from './client';
import type {
  ExpenseClaim,
  ExpenseClaimCreate,
  ExpenseClaimValidateRequest,
  ExpenseClaimValidateResponse,
  ExpenseClaimActionRequest,
  ExpenseType,
  ClaimStatus,
  ClaimListParams,
} from '@/src/types/expense-2';

export const expenseAPI = {
  claimableApps: {
    getAll: async () => {
      const { data } = await apiClient.get('/expense/claimable-travel-applications/');
      console.log("claimable apps: ", data);
      return data;
    }
  },
  claims: {
    getAll: async (params?: ClaimListParams) => {
      const { data } = await apiClient.get('/expense/claims/', { params });
      console.log("claims: ", data);
      return data;
    },
    get: async (id: number) => {
      const { data } = await apiClient.get(`/expense/claims/${id}/`);
      console.log("claim details: ", data.data);
      return data.data;
    },
    create: async (payload: FormData) => {
      const { data } = await apiClient.post('/expense/claims/', payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },

    submit: async (formData: FormData) => {
      const { data } = await apiClient.post('/expense/claims/', formData, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      return data;
    },


    validate: async (payload: ExpenseClaimValidateRequest) => {
      const { data } = await apiClient.post<ExpenseClaimValidateResponse>(
        '/expense/claims/validate/',
        payload
      );
      console.log("expenseType.validate(): ", data);
      return data;
    },
    action: async (id: number, payload: ExpenseClaimActionRequest) => {
      const { data } = await apiClient.post(`/expense/claims/${id}/action/`, payload);
      return data;
    },
    uploadReceipts: async (id: number, formData: FormData) => {
      const { data } = await apiClient.post(
        `/expense/claims/${id}/upload-receipts/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return data;
    },
  },
  expenseTypes: {
    getAll: async () => {
      const { data } = await apiClient.get<ExpenseType[]>('/expense/expense-types/');
      console.log("expenseType.getAll(): ", data);
      return data;
    },
  },
  claimStatus: {
    getAll: async () => {
      const { data } = await apiClient.get<ClaimStatus[]>('/expense/claim-status/');
      console.log("claim status: ", data);
      return data;
    },
  },
};

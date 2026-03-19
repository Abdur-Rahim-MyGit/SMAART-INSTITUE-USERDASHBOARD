import apiCall from "./api";

export const userCertificateApi = {
  getAll: async () => {
    return apiCall('/user-certificates');
  },
  
  upload: async (formData) => {
    return apiCall('/user-certificates', {
      method: 'POST',
      body: formData
    });
  },
  
  delete: async (id) => {
    return apiCall(`/user-certificates/${id}`, {
      method: 'DELETE'
    });
  }
};

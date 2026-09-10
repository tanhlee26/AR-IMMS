import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.0.2.2:5000';

export const login = async (username: string, password: string) => {
  const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
    username,
    password,
  });
  const { token } = response.data;
  await AsyncStorage.setItem('token', token);
  return response.data;
};

export const getMyTickets = async () => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get(`${BASE_URL}/api/v1/tickets/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const requestTicketClosure = async (
  ticketId: number,
  summary: string,
  resolutionDetails: string
) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.post(
    `${BASE_URL}/api/v1/tickets/${ticketId}/request-closure`,
    { summary, resolution_details: resolutionDetails },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const logout = async () => {
  await AsyncStorage.removeItem('token');
};

// TC-63: lấy chi tiết ticket theo ID (đọc từ QR)
export const getTicketById = async (ticketId: number) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get(
    `${BASE_URL}/api/v1/tickets/${ticketId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
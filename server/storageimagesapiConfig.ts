import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {store} from '@redux/index';
import {COMMON} from '@redux/constants';
import {BASE_URL} from '@utils/utility';

const api = axios.create({
  baseURL: BASE_URL,
  validateStatus: status => status <= 201,
});

export const setTokenForAPI = async (tokenProp?: string | null) => {
  if (tokenProp) {
    api.defaults.headers.common['x-access-token'] = tokenProp;
    return;
  }
  const data = await AsyncStorage.getItem(COMMON.TOKENS);
  if (data) {
    const {token} = JSON.parse(data);
    api.defaults.headers.common['x-access-token'] = token;
  }
};

api.interceptors.response.use(undefined, error => {
  if (error.toJSON().status === 401) {
    store.dispatch({type: COMMON.RESET});
  }
  return Promise.reject(error);
});

export default api;

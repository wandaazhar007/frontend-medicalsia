import api from './api';

export function createQueueCall(queue_number, queue_type) {
  return api.post('/queue-calls', { queue_number, queue_type }).then((res) => res.data);
}

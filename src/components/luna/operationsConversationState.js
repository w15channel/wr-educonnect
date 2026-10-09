export function operationsConversationPhase(messages = []) {
  const lastUser = messages.reduce((index, message, i) => message.role === 'user' ? i : index, -1);
  if (lastUser < 0) return 'ready';
  const replies = messages.slice(lastUser + 1);
  const tools = replies.flatMap(message => message.tool_calls || []);
  if (tools.some(tool => ['pending', 'running', 'in_progress'].includes(tool.status))) return 'waiting';
  if (tools.some(tool => tool.status === 'waiting_for_user_input')) return 'ready';
  const last = replies.at(-1);
  if (last?.role !== 'assistant') return 'waiting';
  if (last.reasoning && !last.reasoning.end_date) return 'waiting';
  const hasText = typeof last.content === 'string' && last.content.trim();
  return hasText && (!last.tool_calls?.length || last.usage) ? 'ready' : 'waiting';
}
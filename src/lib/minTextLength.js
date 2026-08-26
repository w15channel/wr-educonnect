// Regra da plataforma: resumos, comentários e respostas de trabalhos
// precisam de no mínimo 1000 caracteres para serem enviados.
export const MIN_TEXT_LENGTH = 1000;

export const textLength = (value = '') => String(value || '').trim().length;

export const isTextLongEnough = (value = '') => textLength(value) >= MIN_TEXT_LENGTH;

export const insufficientTextMessage = (value = '') =>
  `O tamanho da resposta está insuficiente (${textLength(value)}/${MIN_TEXT_LENGTH} caracteres). Trabalhe mais o texto adicionando mais detalhes para liberar o botão de salvar.`;
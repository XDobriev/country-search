import './styles/main.css';
import { createApp } from './ui/App';

function bootstrap(): void {
  const appElement = createApp();
  document.body.appendChild(appElement);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

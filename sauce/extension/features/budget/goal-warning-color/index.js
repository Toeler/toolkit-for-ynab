import { Feature } from 'toolkit/extension/features/feature';

export class GoalWarningColor extends Feature {
  injectCSS() { return require('./index.css'); }
}

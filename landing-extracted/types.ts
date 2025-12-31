
export enum AppView {
  LANDING = 'landing',
  DEMO = 'demo'
}

export interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ModuleState {
  id: string;
  name: string;
  active: boolean;
  icon: string;
  description: string;
}

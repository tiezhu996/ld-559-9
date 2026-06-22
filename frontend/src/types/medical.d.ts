import { VisitType } from '../constants/enums';
import { Pet } from './pet';

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface Vet {
  id: string;
  name: string;
  email: string;
}

export interface MedicalRecord {
  id: string;
  petId: string;
  vetId: string;
  clinicId: string;
  visitDate: string;
  type: VisitType;
  diagnosis: string;
  treatment: string;
  prescription: string;
  cost: number;
  nextVisitDate?: string;
  attachments: string[];
  pet?: Pet;
  vet?: Vet;
  clinic?: Clinic;
}

export interface SearchMedicalParams {
  diagnosis?: string;
  prescription?: string;
  clinicId?: string;
  startDate?: string;
  endDate?: string;
}

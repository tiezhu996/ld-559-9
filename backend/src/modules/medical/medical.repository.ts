import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from '../../constants/enums';
import { PrismaService } from '../../prisma/prisma.service';

interface SearchParams {
  diagnosis?: string;
  prescription?: string;
  clinicId?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class MedicalRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildRoleWhere(user: { sub: string; role: UserRole }): Prisma.MedicalRecordWhereInput {
    if (user.role === UserRole.VET) return { vetId: user.sub };
    if (user.role === UserRole.PET_OWNER) return { pet: { ownerId: user.sub } };
    return {};
  }

  findMany(user: { sub: string; role: UserRole }, petId?: string, type?: string) {
    const where: Prisma.MedicalRecordWhereInput = {
      ...this.buildRoleWhere(user),
      ...(petId ? { petId } : {}),
      ...(type ? { type: type as any } : {}),
    };
    return this.prisma.medicalRecord.findMany({ where, include: { pet: true, vet: true, clinic: true }, orderBy: { visitDate: 'desc' } });
  }

  search(user: { sub: string; role: UserRole }, params: SearchParams) {
    const where: Prisma.MedicalRecordWhereInput = {
      ...this.buildRoleWhere(user),
      ...(params.diagnosis ? { diagnosis: { contains: params.diagnosis, mode: 'insensitive' as Prisma.QueryMode } } : {}),
      ...(params.prescription ? { prescription: { contains: params.prescription, mode: 'insensitive' as Prisma.QueryMode } } : {}),
      ...(params.clinicId ? { clinicId: params.clinicId } : {}),
      ...(params.startDate || params.endDate
        ? {
            visitDate: {
              ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
              ...(params.endDate ? { lte: new Date(params.endDate + 'T23:59:59.999Z') } : {}),
            },
          }
        : {}),
    };
    return this.prisma.medicalRecord.findMany({ where, include: { pet: true, vet: true, clinic: true }, orderBy: { visitDate: 'desc' } });
  }

  create(data: Prisma.MedicalRecordUncheckedCreateInput) {
    return this.prisma.medicalRecord.create({ data });
  }

  update(id: string, data: Prisma.MedicalRecordUncheckedUpdateInput) {
    return this.prisma.medicalRecord.update({ where: { id }, data });
  }
}

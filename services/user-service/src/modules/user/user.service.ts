import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        country: true,
        tier: true,
        emailVerified: true,
        twoFactorEnabled: true,
        kycLevel: true,
        kycVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        country: true,
        tier: true,
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_PROFILE_UPDATE',
        resource: 'user',
        details: updateProfileDto,
        result: 'SUCCESS',
        ipAddress: '0.0.0.0',
        userAgent: 'Unknown',
      },
    });

    return user;
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        isSuspended: true,
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_ACCOUNT_DELETE',
        resource: 'user',
        result: 'SUCCESS',
        ipAddress: '0.0.0.0',
        userAgent: 'Unknown',
      },
    });

    return { message: 'Account deleted successfully' };
  }
}

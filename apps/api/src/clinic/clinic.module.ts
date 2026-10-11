import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ClinicController } from "./clinic.controller";
import { ClinicService } from "./clinic.service";
import { PublicClinicController } from "./public.controller";

@Module({
  imports: [AuthModule],
  controllers: [ClinicController, PublicClinicController],
  providers: [ClinicService],
})
export class ClinicModule {}

import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ClinicService } from "./clinic.service";

@Controller("public/clinics")
export class PublicClinicController {
  constructor(private readonly clinic: ClinicService) {}

  @Get(":slug")
  clinicBySlug(@Param("slug") slug: string) {
    return this.clinic.publicClinic(slug);
  }

  @Post(":slug/appointments")
  book(@Param("slug") slug: string, @Body() body: unknown) {
    return this.clinic.publicBook(slug, body);
  }
}

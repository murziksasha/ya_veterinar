import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import type { AuthUser } from "@vetsync/shared";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user";
import { ClinicService } from "./clinic.service";

@Controller()
@UseGuards(AuthGuard)
export class ClinicController {
  constructor(private readonly clinic: ClinicService) {}

  @Get("plugins")
  plugins() {
    return this.clinic.plugins();
  }

  @Get("billing/subscription")
  subscription(@CurrentUser() actor: AuthUser) {
    return this.clinic.subscription(actor);
  }

  @Post("billing/subscription")
  subscribe(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.clinic.subscribe(actor, body);
  }

  @Get("clients")
  listClients(@CurrentUser() actor: AuthUser) {
    return this.clinic.listClients(actor);
  }

  @Post("clients")
  createClient(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.clinic.createClient(actor, body);
  }

  @Get("clients/:id")
  getClient(@CurrentUser() actor: AuthUser, @Param("id") id: string) {
    return this.clinic.getClient(actor, id);
  }

  @Get("patients")
  listPatients(@CurrentUser() actor: AuthUser) {
    return this.clinic.listPatients(actor);
  }

  @Post("patients")
  createPatient(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.clinic.createPatient(actor, body);
  }

  @Get("patients/:id")
  getPatient(@CurrentUser() actor: AuthUser, @Param("id") id: string) {
    return this.clinic.getPatient(actor, id);
  }

  @Post("patients/:id/records")
  addRecord(@CurrentUser() actor: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.clinic.addRecord(actor, id, body);
  }

  @Post("patients/:id/vaccinations")
  addVaccination(@CurrentUser() actor: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.clinic.addVaccination(actor, id, body);
  }

  @Get("vaccinations/due")
  due(@CurrentUser() actor: AuthUser) {
    return this.clinic.dueVaccinations(actor);
  }

  @Get("appointments")
  listAppointments(
    @CurrentUser() actor: AuthUser,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.clinic.listAppointments(actor, from, to);
  }

  @Post("appointments")
  createAppointment(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.clinic.createAppointment(actor, body);
  }

  @Patch("appointments/:id")
  updateAppointment(@CurrentUser() actor: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.clinic.updateAppointment(actor, id, body);
  }

  @Get("inventory")
  listItems(@CurrentUser() actor: AuthUser) {
    return this.clinic.listItems(actor);
  }

  @Post("inventory")
  createItem(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.clinic.createItem(actor, body);
  }

  @Post("inventory/:id/movements")
  move(@CurrentUser() actor: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.clinic.moveStock(actor, id, body);
  }

  @Get("invoices")
  invoices(@CurrentUser() actor: AuthUser) {
    return this.clinic.listInvoices(actor);
  }

  @Post("invoices")
  createInvoice(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.clinic.createInvoice(actor, body);
  }

  @Post("invoices/:id/pay")
  pay(@CurrentUser() actor: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.clinic.pay(actor, id, body);
  }

  @Post("invoices/:id/void")
  voidInvoice(@CurrentUser() actor: AuthUser, @Param("id") id: string) {
    return this.clinic.voidInvoice(actor, id);
  }

  @Post("invoices/:id/fiscal")
  fiscal(@CurrentUser() actor: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.clinic.fiscalize(actor, id, body);
  }

  @Get("notifications")
  notifications(@CurrentUser() actor: AuthUser) {
    return this.clinic.listNotifications(actor);
  }

  @Post("notifications")
  createNotification(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.clinic.createNotification(actor, body);
  }

  @Post("notifications/:id/dispatch")
  dispatch(@CurrentUser() actor: AuthUser, @Param("id") id: string) {
    return this.clinic.dispatchNotification(actor, id);
  }

  @Post("patients/:id/studies")
  study(@CurrentUser() actor: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.clinic.addStudy(actor, id, body);
  }

  @Get("bi/overview")
  overview(@CurrentUser() actor: AuthUser) {
    return this.clinic.overview(actor);
  }
}

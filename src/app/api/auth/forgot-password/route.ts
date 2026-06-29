import { NextRequest } from "next/server";
import { userService } from "@/services/user.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { forgotPasswordSchema, resetPasswordSchema } from "@/validations/auth.validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = forgotPasswordSchema.parse(body);
    const result = await userService.forgotPassword(validated.email);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = resetPasswordSchema.parse(body);
    const result = await userService.resetPassword(validated.token, validated.password);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

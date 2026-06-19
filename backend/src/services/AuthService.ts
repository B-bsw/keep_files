import { config } from "../config";

export class AuthService {
  public verifyKeyword(keyword: string): boolean {
    return keyword.trim() === config.accessKey;
  }
}

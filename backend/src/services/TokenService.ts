export class TokenService {
  private tempTokens = new Map<string, { fileId: string; expiresAt: number }>();

  constructor() {
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [token, data] of this.tempTokens.entries()) {
      if (now > data.expiresAt) {
        this.tempTokens.delete(token);
      }
    }
  }

  public createToken(fileId: string): string {
    const token = crypto.randomUUID();
    this.tempTokens.set(token, { fileId, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 minutes
    return token;
  }

  public verifyToken(token: string, fileId: string): boolean {
    const tokenData = this.tempTokens.get(token);
    if (!tokenData || tokenData.fileId !== fileId || Date.now() > tokenData.expiresAt) {
      return false;
    }
    return true;
  }
}

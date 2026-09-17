export function generateRoomCode() {
    const characters =
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  
    let code = "";
  
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(
        Math.random() * characters.length
      );
  
      code += characters[randomIndex];
    }
  
    return code;
  }
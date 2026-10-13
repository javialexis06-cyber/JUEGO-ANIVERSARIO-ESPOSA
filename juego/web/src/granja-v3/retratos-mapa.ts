/** Usa los retratos ya producidos. Si falta uno, se ve una silueta; nunca un nombre sobre el mapa. */
export class RetratosMapa {
  private imagenes = new Map<string, HTMLImageElement>();
  dibujar(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, radio: number, color: string) {
    let img = this.imagenes.get(id);
    if (!img) {
      img = new Image(); img.src = './granja/retratos/' + encodeURIComponent(id) + '.webp';
      this.imagenes.set(id, img);
      if (this.imagenes.size > 64) this.imagenes.delete(this.imagenes.keys().next().value!);
    }
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, radio, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = color; ctx.fillRect(x - radio, y - radio, radio * 2, radio * 2);
    if (img.complete && img.naturalWidth) ctx.drawImage(img, x - radio, y - radio, radio * 2, radio * 2);
    else {
      ctx.fillStyle = '#fff6e6'; ctx.beginPath(); ctx.arc(x, y - radio * .22, radio * .32, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, y + radio * .72, radio * .65, radio * .6, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore(); ctx.strokeStyle = '#fff7e6'; ctx.lineWidth = Math.max(1, radio / 6); ctx.beginPath(); ctx.arc(x, y, radio, 0, Math.PI * 2); ctx.stroke();
  }
}

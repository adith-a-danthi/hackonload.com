// Attribution: http://www.html5rocks.com/en/tutorials/canvas/imagefilters/
Filters = {};
Filters.getPixels = function (img) {
	let c, ctx;
	if (img.getContext) {
		c = img;
		try {
			ctx = c.getContext('2d');
		} catch (e) {
		}
	}
	if (!ctx) {
		c = this.getCanvas(img.width, img.height);
		ctx = c.getContext('2d');
		ctx.drawImage(img, 0, 0);
	}
	return ctx.getImageData(0, 0, c.width, c.height);
};

Filters.getCanvas = function (w, h) {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	return c;
};

Filters.filterImage = function (filter, image, var_args) {
	const args = [this.getPixels(image)];
	for (let i = 2; i < arguments.length; i++) {
		args.push(arguments[i]);
	}
	return filter.apply(null, args);
};

Filters.grayscale = function (pixels, args) {
	const d = pixels.data;
	for (let i = 0; i < d.length; i += 4) {
		const r = d[i];
		const g = d[i + 1];
		const b = d[i + 2];
		// CIE luminance for the RGB
		const v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
		d[i] = d[i + 1] = d[i + 2] = v
	}
	return pixels;
};

Filters.brightness = function (pixels, adjustment) {
	const d = pixels.data;
	for (let i = 0; i < d.length; i += 4) {
		d[i] += adjustment;
		d[i + 1] += adjustment;
		d[i + 2] += adjustment;
	}
	return pixels;
};

Filters.threshold = function (pixels, threshold) {
	const d = pixels.data;
	for (let i = 0; i < d.length; i += 4) {
		const r = d[i];
		const g = d[i + 1];
		const b = d[i + 2];
		const v = (0.2126 * r + 0.7152 * g + 0.0722 * b >= threshold) ? 255 : 0;
		d[i] = d[i + 1] = d[i + 2] = v
	}
	return pixels;
};

Filters.tmpCanvas = document.createElement('canvas');
Filters.tmpCtx = Filters.tmpCanvas.getContext('2d');

Filters.createImageData = function (w, h) {
	return this.tmpCtx.createImageData(w, h);
};

Filters.convolute = function (pixels, weights, opaque) {
	const side = Math.round(Math.sqrt(weights.length));
	const halfSide = Math.floor(side / 2);

	const src = pixels.data;
	const sw = pixels.width;
	const sh = pixels.height;

	const w = sw;
	const h = sh;
	const output = Filters.createImageData(w, h);
	const dst = output.data;

	const alphaFac = opaque ? 1 : 0;

	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const sy = y;
			const sx = x;
			const dstOff = (y * w + x) * 4;
			let r = 0, g = 0, b = 0, a = 0;
			for (let cy = 0; cy < side; cy++) {
				for (let cx = 0; cx < side; cx++) {
					const scy = Math.min(sh - 1, Math.max(0, sy + cy - halfSide));
					const scx = Math.min(sw - 1, Math.max(0, sx + cx - halfSide));
					const srcOff = (scy * sw + scx) * 4;
					const wt = weights[cy * side + cx];
					r += src[srcOff] * wt;
					g += src[srcOff + 1] * wt;
					b += src[srcOff + 2] * wt;
					a += src[srcOff + 3] * wt;
				}
			}
			dst[dstOff] = r;
			dst[dstOff + 1] = g;
			dst[dstOff + 2] = b;
			dst[dstOff + 3] = a + alphaFac * (255 - a);
		}
	}
	return output;
};

if (!window.Float32Array)
	Float32Array = Array;

Filters.convoluteFloat32 = function (pixels, weights, opaque) {
	const side = Math.round(Math.sqrt(weights.length));
	const halfSide = Math.floor(side / 2);

	const src = pixels.data;
	const sw = pixels.width;
	const sh = pixels.height;

	const w = sw;
	const h = sh;
	const output = {
		width: w, height: h, data: new Float32Array(w * h * 4)
	};
	const dst = output.data;

	const alphaFac = opaque ? 1 : 0;

	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const sy = y;
			const sx = x;
			const dstOff = (y * w + x) * 4;
			let r = 0, g = 0, b = 0, a = 0;
			for (let cy = 0; cy < side; cy++) {
				for (let cx = 0; cx < side; cx++) {
					const scy = Math.min(sh - 1, Math.max(0, sy + cy - halfSide));
					const scx = Math.min(sw - 1, Math.max(0, sx + cx - halfSide));
					const srcOff = (scy * sw + scx) * 4;
					const wt = weights[cy * side + cx];
					r += src[srcOff] * wt;
					g += src[srcOff + 1] * wt;
					b += src[srcOff + 2] * wt;
					a += src[srcOff + 3] * wt;
				}
			}
			dst[dstOff] = r;
			dst[dstOff + 1] = g;
			dst[dstOff + 2] = b;
			dst[dstOff + 3] = a + alphaFac * (255 - a);
		}
	}
	return output;
};

//
function runFilter(id, filter, arg1, arg2, arg3) {
	const c = document.getElementById(id);
	const s = c.previousSibling.style;
	const b = c.parentNode.getElementsByTagName('button')[0];
	if (b.originalText == null) {
		b.originalText = b.textContent;
	}
	if (s.display == 'none') {
		s.display = 'inline';
		c.style.display = 'none';
		b.textContent = b.originalText;
	} else {
		const idata = Filters.filterImage(filter, img, arg1, arg2, arg3);
		c.width = idata.width;
		c.height = idata.height;
		const ctx = c.getContext('2d');
		ctx.putImageData(idata, 0, 0);
		s.display = 'none';
		c.style.display = 'inline';
		b.textContent = 'Restore original image';
	}
}

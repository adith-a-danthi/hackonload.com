const Canvas = {};

Canvas.getPixels = (canvas) => {
	const ctx = canvas.getContext("2d");
	return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

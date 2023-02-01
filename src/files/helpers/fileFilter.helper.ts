import { Request } from "express";

export const fileFilter = (req: Request, file: Express.Multer.File, callback: Function) => {
    // dentro del callback se envía el error y luego si fue aceptado
    // el return es solo para que no continue ejecutandose
    if (!file) return callback(new Error('File is empty'), false);
    const fileExtension = file.mimetype.split('/')[1];
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    if (validExtensions.includes(fileExtension)) {
        return callback(null, true)
    }
    callback(null, false)

}

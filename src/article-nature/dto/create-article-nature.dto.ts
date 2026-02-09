import { IsNotEmpty, IsString } from "class-validator";

export class CreateArticleNatureDto {
    @IsNotEmpty()
    @IsString()
    code: string;

    @IsNotEmpty()
    @IsString()
    title: string;
}
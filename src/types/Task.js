import { z } from "zod";
export const RegularInstruction = z.object({
    type: z.union([z.literal("regular"), z.undefined()]),
    text: z.string(),
    block: z.string(),
    previousBlock: z.string().optional(),
    blockTag: z.string().optional(),
    parentBlock: z.string().optional(),
    parentStack: z.string().optional(),
});
export const ChangeBlockInstruction = z.object({
    type: z.literal("changeblock"),
    text: z.string(),
    targetBlockTag: z.string(),
    name: z.string(),
    to: z.string().optional(),
    valueVarTag: z.string().optional()
});
export const DialogInstruction = z.object({
    title: z.string(),
    text: z.string(),
    type: z.literal("dialog"),
    closeButton: z.string(),
});
export const QuizInstruction = z.object({
    question: z.string(),
    type: z.literal("quiz"),
    answers: z.array(z.string()).nonempty().length(4),
    correct: z.number().min(0).max(3)
});
export const CommentInstruction = z.object({
    type: z.literal("comment"),
    blockTag: z.string(),
    content: z.string()
});
export const VarCreateInstruction = z.object({
    type: z.literal("varcreate"),
    text: z.string(),
    vartype: z.string(),
    varTag: z.string()
});
export const VarBlockInstruction = z.object({
    type: z.literal("varblock"),
    text: z.string(),
    varTag: z.string(),
    parentTag: z.string()
});
export const CustomBlockInstruction = z.object({
    type: z.literal("customblock"),
    text: z.string(),
    args: z.number(),
    blockTag: z.string().optional(),
});
export const DeleteInstruction = z.object({
    type: z.literal("delete"),
    text: z.string(),
    targetBlockTag: z.string(),
    bannedBlockTags: z.array(z.string()).optional()
});
export const MoveInstruction = z.object({
    type: z.literal("move"),
    text: z.string(),
    fromBlockTag: z.string(),
    toPreviousBlockTag: z.string(),
});
export const CustomBlockArgInstruction = z.object({
    type: z.literal("customblockarg"),
    text: z.string(),
    parentTag: z.string(),
});
export const CustomBlockCallInstruction = z.object({
    type: z.literal("customblockcall"),
    text: z.string(),
    previousTag: z.string(),
    targetBlockTag: z.string(),
    blockTag: z.string()
});
export const RegularTask = z.object({
    name: z.string(),
    desc: z.string(),
    type: z.union([z.undefined(), z.literal("regular")]).optional(),
    wiring: z.string().optional(),
    noclear: z.union([z.undefined(), z.boolean()]).optional(),
    startxml: z.string().optional(),
    varTags: z.object({}).optional(),
    blockTags: z.object({}).optional(),
    instructions: z.array(z.union([
        RegularInstruction,
        ChangeBlockInstruction,
        DialogInstruction,
        QuizInstruction,
        CommentInstruction,
        VarCreateInstruction,
        VarBlockInstruction,
        CustomBlockInstruction,
        DeleteInstruction,
        MoveInstruction,
        CustomBlockArgInstruction,
        CustomBlockCallInstruction
    ]))
});
export const ReadingTask = z.object({
    name: z.string(),
    desc: z.string(),
    type: z.literal("reading")
    // TODO: types for reading tasks
});
export const Task = z.union([RegularTask, ReadingTask]);
export const Section = z.object({
    name: z.string(),
    desc: z.string(),
    img: z.string().optional(),
    tasks: z.array(Task)
});
// export const Tasks = z.array(Task);
export const Tasks = z.array(Section);

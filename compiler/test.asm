add ve, 0xf1
add v0, v1
sub v5, va
subn vf, ve

cls

jp 0xfff
call 0x7ea

se v0, 0x30
se v7, va

sne v0, 0x67
sne v0, vf

ld vb, 0b10001000
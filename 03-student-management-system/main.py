import json
from pathlib import Path
p=Path(__file__).with_name("students.json")
def load():
 try:return json.loads(p.read_text())
 except (OSError,json.JSONDecodeError):return []
def save(a):p.write_text(json.dumps(a,indent=2))
def main():
 a=load()
 while True:
  c=input("\n1 Add 2 List 3 Delete 4 Exit: ")
  if c=="1":
   n=input("Name: ").strip();i=input("Admission number: ").strip()
   if n and i and not any(x["id"]==i for x in a):a.append({"name":n,"id":i});save(a)
   else:print("Fields required or admission number already exists.")
  elif c=="2":print("\n".join(f'{x["id"]}: {x["name"]}' for x in a) or "No records.")
  elif c=="3":
   i=input("Admission number: ");b=[x for x in a if x["id"]!=i]
   if len(b)!=len(a):a=b;save(a)
   else:print("Not found.")
  elif c=="4":break
if __name__=="__main__":main()

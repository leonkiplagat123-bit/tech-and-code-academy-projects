import json
from pathlib import Path
p=Path(__file__).with_name("inventory.json")
def load():
 try:return json.loads(p.read_text())
 except (OSError,json.JSONDecodeError):return []
def save(a):p.write_text(json.dumps(a,indent=2))
def main():
 a=load()
 while True:
  c=input("\n1 Add 2 List 3 Update quantity 4 Exit: ")
  if c=="1":
   n=input("Product: ").strip()
   try:q=int(input("Quantity: "));v=float(input("Unit price KSh: "));assert n and q>=0 and v>=0
   except (ValueError,AssertionError):print("Enter valid non-negative values.");continue
   a.append({"name":n,"quantity":q,"price":v});save(a)
  elif c=="2":print("\n".join(f'{x["name"]}: {x["quantity"]} at KSh {x["price"]} each' for x in a) or "Empty inventory.")
  elif c=="3":
   n=input("Product: ").casefold();x=next((x for x in a if x["name"].casefold()==n),None)
   if x:
    try:q=int(input("New quantity: "));assert q>=0;x["quantity"]=q;save(a)
    except (ValueError,AssertionError):print("Quantity must be zero or more.")
   else:print("Not found.")
  elif c=="4":break
if __name__=="__main__":main()

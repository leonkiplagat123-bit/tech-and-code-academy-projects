import json
from pathlib import Path
p=Path(__file__).with_name("transactions.json")
def load():
 try:return json.loads(p.read_text())
 except (OSError,json.JSONDecodeError):return []
def save(a):p.write_text(json.dumps(a,indent=2))
def main():
 a=load()
 while True:
  c=input("\n1 Income 2 Expense 3 Summary 4 Exit: ")
  if c in ("1","2"):
   try:v=round(float(input("Amount KSh: ")),2);assert v>0
   except (ValueError,AssertionError):print("Enter amount above zero.");continue
   a.append({"type":"income" if c=="1" else "expense","amount":v,"description":input("Description: ")});save(a)
  elif c=="3":
   i=sum(x["amount"] for x in a if x["type"]=="income");e=sum(x["amount"] for x in a if x["type"]=="expense");print(f"Income {i:.2f}; expenses {e:.2f}; balance {i-e:.2f} KSh")
  elif c=="4":break
if __name__=="__main__":main()

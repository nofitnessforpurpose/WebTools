/**
 * OPLCodeContent.js
 * -----------------
 * Data source for OPL Templates and Library Routines.
 * Organized by Compatibility Category.
 */

window.OPL_TEMPLATES = [
  {
    category: "CM/XP/LA Compatible",
    items: [
      {
        name: "Standard Menu",
        description: "A standard menu loop, processing user selection.",
        code:
          `MYMENU:
  LOCAL k%
  DO
    k% = MENU("Option 1","Option 2","Option 3")
    IF k% = 1
      MYCODE1:
    ELSEIF k% = 2
      MYCODE2:
    ELSEIF k% = 3
      MYCODE3:
    ENDIF
  UNTIL k% = 0`
      },
      {
        name: "Dynamic Menu Builder",
        description: "Demonstrates how to programmatically add items to a menu string. Note: To add a procedure to the System Main Menu, you must use the 'Mode' key -> 'Insert' on the device.",
        code:
          `DYNAMENU:
  LOCAL m$(255), k%
  REM Start with base items
  m$ = "View,Edit"
  
  REM Add an item conditionally
  IF EXIST("A:DATA")
    m$ = m$ + ",Delete"
  ENDIF
  
  REM Add another item
  m$ = m$ + ",Quit"
  
  DO
    k% = MENU(m$)
    IF k% = 0
      BREAK
    ELSEIF k% = 1
      REM View
    ELSEIF k% = 2
      REM Edit
    ELSEIF k% = 3 AND LEN(m$) > 15
      REM Delete (Check index carefully using item names is safer)
      REM Logic depends on whether Delete was added
      PRINT "Delete selected"
      GET
    ELSE
      BREAK
    ENDIF
  UNTIL 0`
      },
      {
        name: "Variable Types",
        description: "Examples of defining and inputting Integers, Floats, Strings, and Arrays.",
        code:
          `VARTYPES:
  LOCAL i%, f, s$(10)
  LOCAL ia%(4), fa(4), sa$(4,10)
  
  REM Integer % (Whole number, -32768 to 32767)
  PRINT "Enter Integer:"
  INPUT i%
  
  REM Float (Decimal number, 8 digits precision)
  PRINT "Enter Float:"
  INPUT f
  
  REM String $ (Text, max length in brackets)
  PRINT "Enter String:"
  INPUT s$
  
  REM Integer Array (List of Integers)
  REM ia%(4) has 4 elements: ia%(1) to ia%(4)
  PRINT "Enter Int Array 1:"
  INPUT ia%(1)
  
  REM Float Array (List of Floats)
  PRINT "Enter Float Array 1:"
  INPUT fa(1)
  
  REM String Array (List of Strings)
  REM sa$(4,10): 4 strings, max len 10 each
  PRINT "Enter Str Array 1:"
  INPUT sa$(1)
  
  PRINT "Values:", i%, f, s$
  PRINT "Arrays:", ia%(1), fa(1), sa$(1)
  GET`
      },
      {
        name: "Input Process Output",
        description: "A procedure demonstrating the 'Input -> Process -> Output' principle. Checks if a number is prime.",
        code:
          `ISPRIME%:(n%)
  LOCAL i%
  
  REM -- INPUT --
  REM Parameter n% is the input

  REM -- PROCESS --
  REM 1. Check simple cases
  IF n% < 2 : RETURN 0 : ENDIF
  
  REM 2. Loop to check factors
  i% = 2
  DO
    REM If divisible, it's not prime
    IF (n% / i%) * i% = n%
      RETURN 0
    ENDIF
    i% = i% + 1
  UNTIL i% * i% > n%

  REM -- OUTPUT --
  REM Returns -1 (True) if prime
  RETURN -1`
      },
      {
        name: "For Loop (Do Until)",
        description: "Simulating a FOR NEXT loop using DO UNTIL. OPL does not have a native FOR command.",
        code:
          `FORLOOP:
  LOCAL i%
  
  REM Emulating: FOR i% = 1 TO 5
  
  i% = 1            REM Initialise (FOR)
  DO
    PRINT "Loop:", i%
    
    REM ... Body of loop ...
    
    i% = i% + 1     REM Increment (NEXT)
  UNTIL i% > 5      REM Condition (TO 5)
  GET`
      },
      {
        name: "Recursion (Factorial)",
        description: "A recursive procedure calling itself. Shows the termination condition.",
        code:
          `FACT:(n)
  REM Calculates n! (Factorial n)
  REM e.g. FACT:(5) = 120
  
  REM -- TERMINATION CONDITION --
  REM Recursion MUST stop somewhere
  IF n <= 1
    RETURN 1
  ENDIF
  
  REM -- RECURSIVE STEP --
  REM Calls itself with (n-1)
  RETURN n * FACT:(n-1)`
      },
      {
        name: "File Processing Loop",
        description: "Opens a file and processes records one by one.",
        code:
          `MYRECS:
  LOCAL a$(255)
  TRAP OPEN "A:DATA", A, a$
  IF ERR
    PRINT "File error:", ERR
    GET
    RETURN
  ENDIF

  FIRST
  WHILE NOT EOF
    PRINT A.a$
    NEXT
  ENDWH
  CLOSE`
      },
      {
        name: "Graphics Loop",
        description: "Specific loop for handling graphics and user input.",
        code:
          `DOGRAPH:
  LOCAL k%
  CURSOR OFF
  CLS
  AT 1,1
  PRINT "Press 'Q' to quit"
  
  DO
    k% = GET
    
    IF k% = %Q OR k% = %q
      BREAK
    ENDIF
    
    REM Draw something based on key
  UNTIL 0`
      },
      {
        name: "Database Suite",
        description: "Complete suite for managing an address book database (Create, Insert, Search, Alter, Erase).",
        code:
          `FILES:
  LOCAL m%
  IF NOT EXIST("A:ADDR")
    CREATE "A:ADDR",A,n$,ad1$,ad2$,ad3$,pc$,tel$
  ELSE
    OPEN "A:ADDR",A,n$,ad1$,ad2$,ad3$,pc$,tel$
  ENDIF
  DO
    m%=MENU("INSERT,SEARCH,ALTER,ERASE,QUIT")
    IF m%=0 OR m%=5
      STOP
    ELSEIF m%=1
      INSERT:
    ELSEIF m%=2
      SEARCH:
    ELSEIF m%=3
      ALTER:
    ELSEIF m%=4
      ERASE:
    ENDIF
  UNTIL 0

INSERT:
  PRINT "ENTER NAME"
  INPUT A.n$
  CLS
  PRINT "ENTER STREET"
  INPUT A.ad1$
  CLS
  PRINT "ENTER TOWN"
  INPUT A.ad2$
  CLS
  PRINT "ENTER COUNTY"
  INPUT A.ad3$
  CLS
  PRINT "ENTER PCODE"
  INPUT A.pc$
  CLS
  PRINT "ENTER TELNUM"
  INPUT A.tel$
  APPEND

SEARCH:
  LOCAL recnum%,search$(30)
  top::
  FIRST
  CLS
  PRINT "FIND:";
  TRAP INPUT search$
  IF ERR=206
    RETURN
  ENDIF
  recnum%=FIND(search$)
  IF recnum%=0
    CLS
    PRINT "NOT FOUND"
    PAUSE 20
    GOTO top::
  ENDIF
  DO
    DISP(-1,"")
    NEXT
    recnum%=FIND(search$)
    IF recnum%=0
      CLS
      PRINT " NO MORE ENTRIES"
      PAUSE 20
      RETURN
    ENDIF
  UNTIL 0

ALTER:
  LOCAL recnum%,search$(30),k%
  DO
    FIRST
    CLS
    PRINT "ALTER:";
    TRAP INPUT search$
    IF ERR=206
      RETURN
    ENDIF
    recnum%=FIND(search$)
    IF recnum%=0
      CLS
      PRINT "NOT FOUND"
      PAUSE 20
      CONTINUE
    ENDIF
    DO
      KSTAT 1
      CLS
      AT 1,2
      PRINT "EDIT Y/N"
      k%=VIEW(1,A.n$)
      IF k%=%Y
        CLS
        EDIT A.n$
        EDIT A.ad1$
        EDIT A.ad2$
        EDIT A.ad3$
        EDIT A.pc$
        EDIT A.tel$
        UPDATE
        RETURN
      ELSEIF k%=%N
        NEXT
        recnum%=FIND(search$)
        IF recnum%=0
          CLS
          PRINT "NOT FOUND"
          PAUSE 20
          BREAK
        ENDIF
      ENDIF
    UNTIL 0
  UNTIL 0

ERASE:
  LOCAL recnum%,search$(30),k%
  FIRST
  CLS
  PRINT "ERASE:";
  TRAP INPUT search$
  IF ERR=206
    RETURN
  ENDIF
  recnum%=FIND(search$)
  DO
    IF recnum%=0
      CLS
      PRINT "NOT FOUND"
      PAUSE 20
      RETURN
    ENDIF
    ask::
    KSTAT 1
    AT 1,2
    PRINT "ERASE Y/N"
    k%=VIEW(1,A.n$)
    IF k%<>%Y AND k%<>%N
      GOTO ask::
    ELSEIF k%=%Y
      ERASE
    ELSEIF k%=%N
      NEXT
      recnum%=FIND(search$)
    ENDIF
  UNTIL EOF`
      }
    ]
  },
  {
    category: "LZ Compatible",
    items: [
      {
        name: "Multi-Line Menu (LZ)",
        description: "Uses the LZ specific MENU command capabilities.",
        code:
          `MAINLZ:
  LOCAL k%
  REM LZ screens can show more menu items
  do
    k% = MENU("Item1","Item2","Item3","Item4","Item5")
    IF k% = 1
      REM Action 1
    ELSEIF k% = 2
      REM Action 2
    ENDIF
  UNTIL k% = 0`
      }
    ]
  }
];

window.OPL_LIBRARY_ROUTINES = [
  {
    category: "CM/XP/LA Compatible",
    items: [
      {
        name: "Input Routine",
        description: "General purpose input prompt (from XP Manual).",
        code:
          `Q:(a$)
  LOCAL z
  ONERR l1::
  l1::
  CLS
  PRINT a$,CHR$(16);
  INPUT z
  CLS
  RETURN z`
      },
      {
        name: "Password Check",
        description: "Startup password protection (from XP Manual).",
        code:
          `PASSWORD:
  LOCAL a$(20)
  ONERR start::
  start::
  OFF
  CLS
  PRINT "Enter password"
  INPUT a$
  IF a$<>"MyPass"
    GOTO start::
  ENDIF`
      },
      {
        name: "Mute Toggle",
        description: "Toggles system sound on/off (from XP Manual).",
        code:
          `MUTE:
  PRINT "Sound now <";
  IF PEEKB($A4)=0
    POKEB $A4,1
    PRINT "OFF>"
  ELSE
    PRINT "ON>"
    POKEB $A4,0
  ENDIF
  PRINT "Press any key"
  GET`
      },
      {
        name: "Days Difference",
        description: "Calculates the number of days between two dates.",
        code:
          `DAYSDIFF:
  LOCAL d1%,m1%,y1%,d2%,m2%,y2%
  PRINT "ENTER FIRST DAY"
  INPUT d1%
  PRINT "ENTER FIRST MONTH"
  INPUT m1%
  PRINT "ENTER FIRST YEAR"
  INPUT y1%
  PRINT "ENTER SECOND DAY"
  INPUT d2%
  PRINT "ENTER SECOND MONTH"
  INPUT m2%
  PRINT "ENTER SECOND YEAR"
  INPUT y2%
  PRINT DAYS(d2%,m2%,y2%)-DAYS(d1%,m1%,y1%)
  GET`
      },
      {
        name: "UDG Loader",
        description: "Classic routine to load User Defined Graphics (Characters 0-7).",
        code:
          `UDG:(c%,a1%,a2%,a3%,a4%,a5%,a6%,a7%,a8%)
  LOCAL a%
  REM Base address for UDG 0 is $2187
  a% = $2187 + c% * 8
  POKEB a%, a1%
  POKEB a% + 1, a2%
  POKEB a% + 2, a3%
  POKEB a% + 3, a4%
  POKEB a% + 4, a5%
  POKEB a% + 5, a6%
  POKEB a% + 6, a7%
  POKEB a% + 7, a8%`
      },
      {
        name: "Center Text",
        description: "Centers a string on the specific line width.",
        code:
          `CENTER:(s$, w%)
  LOCAL p%
  p% = (w% - LEN(s$)) / 2
  IF p% > 0
    PRINT REPT$(" ", p%);
  ENDIF
  PRINT s$`
      },
      {
        name: "Wait for Key",
        description: "Waits specifically for a key press and clears the buffer.",
        code:
          `WAITKEY:
  LOCAL k%
  DO
    k% = KEY
  UNTIL k% = 0
  GET`
      },
      {
        name: "File Exists Check",
        description: "Checks if a file exists without raising an error.",
        code:
          `FEXIST%:(f$)
  LOCAL ret%
  TRAP OPEN f$, A, a$
  IF ERR
    ret% = 0
  ELSE
    CLOSE
    ret% = -1
  ENDIF
  RETURN ret%`
      },
      {
        name: "Top Level Menu Item",
        description: "Adds an item to the top level menu (System/Main Menu) at the specified position.",
        code:
          `ADDTOP:(item$, pos%)
  REM Adds item$ item to the top level menu pos location

  LOCAL I%, A%(2)
  IF (LEN(item$) > 8)
    RAISE 202 :REM Menu too big
  ENDIF

  POKEB $2187,LEN(item$)
  I% = 1
  WHILE (I% <= LEN(item$))
    POKEB $2187 + I%, ASC(MID$(item$, I%, 1))
    I% = I% + 1
  ENDWH

  POKEW $2188 + LEN(item$), 0
  REM Machine code in array A%
  A%(1)=$3F65
  A%(2)=$3900
  REM Call the machine code
  USR(ADDR(A%()), pos%)`
      }
    ]
  },
  {
    category: "LZ Compatible",
    items: [
      {
        name: "Dice",
        description: "Simulates rolling a dice (from LZ Manual).",
        code:
          `DICE:
  LOCAL dice%,key%
  KSTAT 1
  top::
  CLS
  PRINT "****DICE ROLLING****"
  PRINT "PRESS S TO STOP"
  DO
    dice%=(RND*6+1)
  UNTIL KEY$="S"
  CLS
  PRINT "********* ";dice%;" ********"
  BEEP 50,100
  AT 1,4
  PRINT "ROLL AGAIN Y/N"
  label::
  key%=GET
  IF key%=%Y
    GOTO top::
  ELSEIF key%=%N
    RETURN
  ELSE
    GOTO label::
  ENDIF`
      }
    ]
  }
];
